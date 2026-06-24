$ErrorActionPreference = 'Stop'
$base = 'C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$criticService = @'
package com.dalai.llama.creator.service;

import com.dalai.llama.creator.ai.GeminiRateLimitGuard;
import com.dalai.llama.creator.ai.GeminiUsageMetadataParser;
import com.dalai.llama.creator.ai.GoogleGenAiClientFactory;
import com.dalai.llama.creator.config.CreatorProperties;
import com.dalai.llama.creator.domain.entity.CreatorAsset;
import com.dalai.llama.creator.domain.entity.CreatorShortVideo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class GoogleShortTranscriptCriticService {

    private static final Logger log = LoggerFactory.getLogger(GoogleShortTranscriptCriticService.class);
    private static final String PROMPT_TYPE = "SHORTS_TRANSCRIPT_CRITIC";
    private static final int CHUNK_SECONDS = 120;
    private static final int RESPONSE_MAX_IN_MEMORY_BYTES = 24 * 1024 * 1024;
    private static final int MAX_TRANSCRIPT_CHARS_PER_CHUNK = 12000;
    private static final Duration AUDIO_COMMAND_TIMEOUT = Duration.ofMinutes(30);

    private final CreatorProperties properties;
    private final AssetStorageService assetStorageService;
    private final CreatorAiPricingService pricingService;
    private final GeminiUsageMetadataParser usageMetadataParser;
    private final GoogleGenAiClientFactory googleGenAiClientFactory;
    private final GeminiRateLimitGuard geminiRateLimitGuard;
    private final ObjectMapper objectMapper;

    public GoogleShortTranscriptCriticService(
            CreatorProperties properties,
            AssetStorageService assetStorageService,
            CreatorAiPricingService pricingService,
            GeminiUsageMetadataParser usageMetadataParser,
            GoogleGenAiClientFactory googleGenAiClientFactory,
            GeminiRateLimitGuard geminiRateLimitGuard,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.assetStorageService = assetStorageService;
        this.pricingService = pricingService;
        this.usageMetadataParser = usageMetadataParser;
        this.googleGenAiClientFactory = googleGenAiClientFactory;
        this.geminiRateLimitGuard = geminiRateLimitGuard;
        this.objectMapper = objectMapper;
    }

    public TranscriptCriticResult critique(CreatorShortVideo video, CreatorAsset sourceAsset, List<Map<String, Object>> transcript) {
        String model = stringValue(properties.getAi().getGeminiModel(), "gemini-2.5-flash");
        List<Map<String, Object>> safeTranscript = copyList(transcript);
        if (sourceAsset == null || isBlank(sourceAsset.getBucket()) || isBlank(sourceAsset.getObjectKey())) {
            return skipped(model, "SKIPPED", "Source video storage location is missing.", safeTranscript);
        }

        Path workspace = null;
        try {
            workspace = Files.createTempDirectory("creator-shorts-transcript-critic-");
            Path sourcePath = workspace.resolve("source" + extensionFor(sourceAsset.getContentType(), sourceAsset.getObjectKey()));
            Path chunkDir = Files.createDirectories(workspace.resolve("critic-audio-chunks"));

            assetStorageService.downloadObjectToPath(sourceAsset.getBucket(), sourceAsset.getObjectKey(), sourcePath);
            extractAudioChunks(sourcePath, chunkDir);

            List<Path> chunks = audioChunks(chunkDir);
            if (chunks.isEmpty()) {
                return skipped(model, "WARN", "No audio chunks were produced for transcript criticism.", safeTranscript);
            }

            List<Map<String, Object>> chunkAudits = new ArrayList<>();
            long inputTokens = 0;
            long outputTokens = 0;
            long totalTokens = 0;
            long providerTotalTokens = 0;
            for (int index = 0; index < chunks.size(); index++) {
                int chunkStart = index * CHUNK_SECONDS;
                int chunkEnd = chunkStart + CHUNK_SECONDS;
                List<Map<String, Object>> slice = transcriptSlice(safeTranscript, chunkStart, chunkEnd);
                ChunkAuditResult audit = critiqueChunk(model, video, sourceAsset, chunks.get(index), index, chunkStart, chunkEnd, slice);
                chunkAudits.add(audit.audit());
                inputTokens += longValue(audit.tokenMetadata().get("inputTokens"));
                outputTokens += longValue(audit.tokenMetadata().get("outputTokens"));
                totalTokens += longValue(audit.tokenMetadata().get("totalTokens"));
                providerTotalTokens += longValue(audit.tokenMetadata().get("providerTotalTokens"));
            }

            List<String> deterministicIssues = deterministicTranscriptIssues(safeTranscript);
            Map<String, Object> aggregate = aggregate(chunkAudits, deterministicIssues, safeTranscript, chunks.size());

            String usageSource = providerTotalTokens > 0 || inputTokens > 0 || outputTokens > 0 ? "PROVIDER" : "ESTIMATED_TEXT_ONLY";
            Map<String, Object> tokenMetadata = new LinkedHashMap<>();
            tokenMetadata.put("inputTokens", inputTokens);
            tokenMetadata.put("outputTokens", outputTokens);
            tokenMetadata.put("totalTokens", Math.max(totalTokens, inputTokens + outputTokens));
            tokenMetadata.put("providerTotalTokens", providerTotalTokens);
            tokenMetadata.put("source", usageSource);
            tokenMetadata.put("chunkSeconds", CHUNK_SECONDS);
            tokenMetadata.put("chunkCount", chunks.size());

            Map<String, Object> costMetadata = pricingService.estimateTextCall(
                    "gemini",
                    model,
                    PROMPT_TYPE,
                    inputTokens,
                    outputTokens,
                    usageSource
            );
            costMetadata.put("provider", "gemini");
            costMetadata.put("model", model);
            costMetadata.put("operation", PROMPT_TYPE);

            String status = stringValue(aggregate.get("status"), "WARN");
            double confidence = doubleValue(aggregate.get("confidence"), 0.5);
            Map<String, Object> traceMetadata = new LinkedHashMap<>();
            traceMetadata.put("source", "gemini_audio_alignment_critic");
            traceMetadata.put("chunkCount", chunks.size());
            traceMetadata.put("nodeCount", safeTranscript.size());
            traceMetadata.put("passedChunks", aggregate.get("passedChunks"));
            traceMetadata.put("warnChunks", aggregate.get("warnChunks"));
            traceMetadata.put("failedChunks", aggregate.get("failedChunks"));
            traceMetadata.put("deterministicIssues", deterministicIssues);

            List<Map<String, Object>> trace = List.of(traceRow(
                    "TRANSCRIPT_CRITIC",
                    status,
                    stringValue(aggregate.get("summary"), "Deep transcript critic completed."),
                    confidence,
                    traceMetadata
            ));

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("source", "gemini_audio_alignment_critic");
            metadata.put("status", status);
            metadata.put("summary", aggregate.get("summary"));
            metadata.put("coverage", aggregate.get("coverage"));
            metadata.put("chunkSeconds", CHUNK_SECONDS);
            metadata.put("chunkCount", chunks.size());
            metadata.put("nodeCount", safeTranscript.size());
            metadata.put("chunkAudits", chunkAudits);
            metadata.put("deterministicIssues", deterministicIssues);
            metadata.put("generatedAt", OffsetDateTime.now().toString());

            return new TranscriptCriticResult(true, "gemini", model, trace, chunkAudits, tokenMetadata, costMetadata, metadata);
        } catch (Exception ex) {
            log.warn("Deep transcript critic failed videoId={} message={}", video == null ? null : video.getId(), ex.getMessage(), ex);
            return skipped(model, "WARN", "Deep transcript critic failed: " + ex.getMessage(), safeTranscript);
        } finally {
            deleteQuietly(workspace);
        }
    }

    private void extractAudioChunks(Path sourcePath, Path chunkDir) {
        run(List.of(
                "ffmpeg",
                "-hide_banner",
                "-y",
                "-i", sourcePath.toString(),
                "-vn",
                "-ac", "1",
                "-ar", "16000",
                "-f", "segment",
                "-segment_time", String.valueOf(CHUNK_SECONDS),
                "-reset_timestamps", "1",
                chunkDir.resolve("critic-chunk-%05d.wav").toString()
        ), AUDIO_COMMAND_TIMEOUT, "ffmpeg transcript critic audio chunking");
    }

    private ChunkAuditResult critiqueChunk(
            String model,
            CreatorShortVideo video,
            CreatorAsset sourceAsset,
            Path chunkPath,
            int chunkIndex,
            int chunkStart,
            int chunkEnd,
            List<Map<String, Object>> transcriptSlice
    ) throws IOException {
        byte[] audioBytes = Files.readAllBytes(chunkPath);
        String prompt = buildPrompt(video, sourceAsset, chunkIndex, chunkStart, chunkEnd, audioBytes.length, transcriptSlice);
        Map<String, Object> request = buildRequest(prompt, audioBytes);
        Map<String, Object> response = geminiRateLimitGuard.execute(PROMPT_TYPE, model, () ->
                googleGenAiClientFactory.client(RESPONSE_MAX_IN_MEMORY_BYTES)
                        .post()
                        .uri(googleGenAiClientFactory.generateContentUri(model))
                        .bodyValue(request)
                        .retrieve()
                        .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                        })
                        .block(Duration.ofMillis(properties.getAi().getTimeoutMs()))
        );
        return normalizeChunkAudit(model, prompt, response == null ? Map.of() : response, chunkIndex, chunkStart, chunkEnd, audioBytes.length, transcriptSlice.size());
    }

    private Map<String, Object> buildRequest(String prompt, byte[] audioBytes) {
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));
        parts.add(Map.of("inline_data", Map.of(
                "mime_type", "audio/wav",
                "data", Base64.getEncoder().encodeToString(audioBytes)
        )));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        if (properties.getAi().getMaxOutputTokens() != null && properties.getAi().getMaxOutputTokens() > 0) {
            generationConfig.put("maxOutputTokens", properties.getAi().getMaxOutputTokens());
        }

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", "You are a transcript QA critic. Return only one valid JSON object.")))
        );
        request.put("contents", List.of(Map.of(
                "role", "user",
                "parts", parts
        )));
        request.put("generationConfig", generationConfig);
        return request;
    }

    private String buildPrompt(
            CreatorShortVideo video,
            CreatorAsset sourceAsset,
            int chunkIndex,
            int chunkStart,
            int chunkEnd,
            int audioBytes,
            List<Map<String, Object>> transcriptSlice
    ) {
        return """
                Deep-audit the attached audio chunk against the transcript slice produced by the Generate Shorts full transcript worker.

                This is an independent TRANSCRIPT_CRITIC pass. Do not rewrite the transcript unless needed for suggested repairs.
                Judge whether the transcript slice is faithful to the audio, whether timestamps line up, whether speech is missing,
                whether text appears hallucinated, and whether speaker labels are stable enough for downstream compression.

                Context:
                {
                  "shortVideoId": "%s",
                  "title": "%s",
                  "sourceAssetId": "%s",
                  "chunkIndex": %s,
                  "chunkStartSeconds": %s,
                  "chunkEndSeconds": %s,
                  "audioFormat": "wav 16khz mono",
                  "audioBytes": %s,
                  "transcriptNodeCount": %s
                }

                Transcript slice for this chunk:
                %s

                Return JSON only:
                {
                  "status": "PASS|WARN|FAIL",
                  "confidence": 0.0,
                  "coverage": {
                    "speechCoverage": "complete|mostly_complete|partial|missing|no_speech",
                    "missingSpeechEstimateSeconds": 0.0,
                    "hallucinationRisk": "low|medium|high",
                    "timestampDriftSeconds": 0.0,
                    "speakerConsistency": "good|mixed|poor|unknown"
                  },
                  "issues": [
                    {"severity":"low|medium|high","type":"missing_speech|hallucination|timestamp_drift|speaker_mismatch|noise|language|empty_transcript","start":0.0,"end":0.0,"summary":"..."}
                  ],
                  "suggestedRepairs": [
                    {"nodeId":"n-0001","action":"split|merge|retime|replace_text|mark_uncertain","summary":"..."}
                  ],
                  "summary": "one sentence"
                }

                PASS only when the transcript is faithful enough for exact short-video cuts.
                WARN if usable but with missing words, weak speaker labels, timestamp drift, or noisy sections.
                FAIL if the slice is mostly unusable or hallucinated.
                """.formatted(
                video == null || video.getId() == null ? "" : video.getId(),
                video == null ? "" : escape(video.getTitle()),
                sourceAsset == null || sourceAsset.getId() == null ? "" : sourceAsset.getId(),
                chunkIndex,
                chunkStart,
                chunkEnd,
                audioBytes,
                transcriptSlice.size(),
                compact(toJson(transcriptSlice), MAX_TRANSCRIPT_CHARS_PER_CHUNK)
        );
    }

    private ChunkAuditResult normalizeChunkAudit(
            String model,
            String prompt,
            Map<String, Object> response,
            int chunkIndex,
            int chunkStart,
            int chunkEnd,
            int audioBytes,
            int transcriptNodeCount
    ) {
        String rawText = outputText(response);
        Map<String, Object> output = parseJsonObject(rawText);
        Map<String, Object> usage = usageMetadataParser.parse(response.get("usageMetadata"));
        long fallbackInputTokens = pricingService.estimateTextTokens(prompt);
        long providerInputTokens = longValue(usage.get("inputTokens"));
        long inputTokens = Math.max(providerInputTokens, fallbackInputTokens);
        long outputTokens = longValue(usage.get("outputTokens"));

        Map<String, Object> tokenMetadata = new LinkedHashMap<>(usage);
        tokenMetadata.put("inputTokens", inputTokens);
        tokenMetadata.put("outputTokens", outputTokens);
        tokenMetadata.put("totalTokens", Math.max(longValue(usage.get("totalTokens")), inputTokens + outputTokens));
        tokenMetadata.put("providerTotalTokens", longValue(usage.get("totalTokens")));
        tokenMetadata.put("source", providerInputTokens > 0 || outputTokens > 0 ? "PROVIDER" : "ESTIMATED_TEXT_ONLY");

        Map<String, Object> audit = new LinkedHashMap<>();
        audit.put("chunkIndex", chunkIndex);
        audit.put("chunkStartSeconds", chunkStart);
        audit.put("chunkEndSeconds", chunkEnd);
        audit.put("audioBytes", audioBytes);
        audit.put("transcriptNodeCount", transcriptNodeCount);
        audit.put("status", normalizeStatus(output.get("status")));
        audit.put("confidence", doubleValue(output.get("confidence"), 0.5));
        audit.put("coverage", mapValue(output.get("coverage")));
        audit.put("issues", listOfMaps(output.get("issues")));
        audit.put("suggestedRepairs", listOfMaps(output.get("suggestedRepairs")));
        audit.put("summary", stringValue(output.get("summary"), "Transcript chunk audit completed."));
        audit.put("model", model);
        audit.put("rawTextPreview", compact(rawText, 1600));
        return new ChunkAuditResult(audit, tokenMetadata);
    }

    private Map<String, Object> aggregate(List<Map<String, Object>> chunkAudits, List<String> deterministicIssues, List<Map<String, Object>> transcript, int chunkCount) {
        int pass = 0;
        int warn = 0;
        int fail = 0;
        double confidenceTotal = 0.0;
        double missingSpeech = 0.0;
        double maxDrift = 0.0;
        for (Map<String, Object> audit : chunkAudits) {
            String status = normalizeStatus(audit.get("status"));
            if ("FAIL".equals(status)) {
                fail++;
            } else if ("WARN".equals(status)) {
                warn++;
            } else {
                pass++;
            }
            confidenceTotal += doubleValue(audit.get("confidence"), 0.5);
            Map<String, Object> coverage = mapValue(audit.get("coverage"));
            missingSpeech += Math.max(0.0, doubleValue(coverage.get("missingSpeechEstimateSeconds"), 0.0));
            maxDrift = Math.max(maxDrift, Math.abs(doubleValue(coverage.get("timestampDriftSeconds"), 0.0)));
        }

        if (transcript.isEmpty()) {
            deterministicIssues.add("Transcript is empty.");
        }

        String status;
        if (fail > 0 || transcript.isEmpty()) {
            status = fail > Math.max(1, chunkCount / 3) || transcript.isEmpty() ? "FAIL" : "WARN";
        } else if (warn > 0 || !deterministicIssues.isEmpty()) {
            status = "WARN";
        } else {
            status = "PASS";
        }

        Map<String, Object> coverage = new LinkedHashMap<>();
        coverage.put("missingSpeechEstimateSeconds", round3(missingSpeech));
        coverage.put("maxTimestampDriftSeconds", round3(maxDrift));
        coverage.put("deterministicIssueCount", deterministicIssues.size());

        String summary;
        if ("PASS".equals(status)) {
            summary = "Deep transcript critic verified audio coverage, timestamp order, and speaker continuity across " + chunkCount + " chunks.";
        } else if ("WARN".equals(status)) {
            summary = "Deep transcript critic found usable transcript with warnings across " + chunkCount + " chunks.";
        } else {
            summary = "Deep transcript critic found transcript quality problems that can affect downstream cuts.";
        }

        Map<String, Object> aggregate = new LinkedHashMap<>();
        aggregate.put("status", status);
        aggregate.put("confidence", chunkAudits.isEmpty() ? 0.0 : round3(confidenceTotal / chunkAudits.size()));
        aggregate.put("summary", summary);
        aggregate.put("coverage", coverage);
        aggregate.put("passedChunks", pass);
        aggregate.put("warnChunks", warn);
        aggregate.put("failedChunks", fail);
        return aggregate;
    }

    private List<String> deterministicTranscriptIssues(List<Map<String, Object>> transcript) {
        List<String> issues = new ArrayList<>();
        double previousEnd = -1.0;
        for (Map<String, Object> node : transcript) {
            double start = doubleValue(node.get("start"), -1.0);
            double end = doubleValue(node.get("end"), -1.0);
            String text = stringValue(node.get("transcript"), "").trim();
            if (start < 0 || end <= start) {
                issues.add("Invalid timestamp on node " + stringValue(node.get("id"), "unknown") + ".");
            }
            if (previousEnd >= 0 && start < previousEnd - 0.25) {
                issues.add("Overlapping transcript timestamps around node " + stringValue(node.get("id"), "unknown") + ".");
            }
            if (previousEnd >= 0 && start - previousEnd > 45) {
                issues.add("Large transcript gap of " + round3(start - previousEnd) + " seconds before node " + stringValue(node.get("id"), "unknown") + ".");
            }
            if (text.length() < 2) {
                issues.add("Empty or near-empty transcript text on node " + stringValue(node.get("id"), "unknown") + ".");
            }
            previousEnd = Math.max(previousEnd, end);
            if (issues.size() >= 20) {
                break;
            }
        }
        return issues;
    }

    private List<Map<String, Object>> transcriptSlice(List<Map<String, Object>> transcript, double chunkStart, double chunkEnd) {
        List<Map<String, Object>> slice = new ArrayList<>();
        for (Map<String, Object> node : transcript) {
            double start = doubleValue(node.get("start"), -1.0);
            double end = doubleValue(node.get("end"), start);
            if (end >= chunkStart - 1.0 && start <= chunkEnd + 1.0) {
                Map<String, Object> copy = new LinkedHashMap<>(node);
                slice.add(copy);
            }
        }
        return slice;
    }

    private TranscriptCriticResult skipped(String model, String status, String reason, List<Map<String, Object>> transcript) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", "gemini_audio_alignment_critic");
        metadata.put("status", status);
        metadata.put("reason", reason);
        metadata.put("nodeCount", transcript == null ? 0 : transcript.size());
        metadata.put("generatedAt", OffsetDateTime.now().toString());

        List<Map<String, Object>> trace = List.of(traceRow(
                "TRANSCRIPT_CRITIC",
                status,
                reason,
                "FAIL".equals(status) || "FAILED".equals(status) ? 0.0 : 0.25,
                metadata
        ));
        Map<String, Object> tokenMetadata = new LinkedHashMap<>();
        tokenMetadata.put("inputTokens", 0);
        tokenMetadata.put("outputTokens", 0);
        tokenMetadata.put("totalTokens", 0);
        tokenMetadata.put("source", "NONE");
        Map<String, Object> costMetadata = pricingService.estimateTextCall("gemini", model, PROMPT_TYPE, 0, 0, "NONE");
        costMetadata.put("provider", "gemini");
        costMetadata.put("model", model);
        costMetadata.put("operation", PROMPT_TYPE);
        return new TranscriptCriticResult(false, "gemini", model, trace, List.of(), tokenMetadata, costMetadata, metadata);
    }

    private List<Path> audioChunks(Path chunkDir) throws IOException {
        try (var stream = Files.list(chunkDir)) {
            return stream
                    .filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".wav"))
                    .sorted()
                    .toList();
        }
    }

    private String run(List<String> command, Duration timeout, String label) {
        try {
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(timeout.toSeconds(), TimeUnit.SECONDS);
            String output = new String(process.getInputStream().readAllBytes());
            if (!finished) {
                process.destroyForcibly();
                throw new IllegalStateException(label + " timed out.");
            }
            if (process.exitValue() != 0) {
                throw new IllegalStateException(label + " failed: " + tail(output, 3000));
            }
            return output;
        } catch (IOException ex) {
            throw new IllegalStateException("ffmpeg is not available for " + label + ".", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(label + " was interrupted.", ex);
        }
    }

    private Map<String, Object> traceRow(String stage, String status, String summary, double confidence, Map<String, Object> metadata) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("stage", stage);
        row.put("status", status);
        row.put("summary", summary);
        row.put("confidence", confidence);
        row.put("agent", stage.toLowerCase(Locale.ROOT).replace('_', '-'));
        row.put("timestamp", OffsetDateTime.now().toString());
        row.put("metadata", metadata == null ? Map.of() : metadata);
        return row;
    }

    private String outputText(Map<String, Object> response) {
        Object candidates = response.get("candidates");
        if (candidates instanceof List<?> candidateItems) {
            StringBuilder text = new StringBuilder();
            for (Object candidateItem : candidateItems) {
                Map<String, Object> candidate = mapValue(candidateItem);
                Map<String, Object> content = mapValue(candidate.get("content"));
                Object parts = content.get("parts");
                if (parts instanceof List<?> partItems) {
                    for (Object partItem : partItems) {
                        Map<String, Object> part = mapValue(partItem);
                        Object partText = part.get("text");
                        if (partText != null && !String.valueOf(partText).isBlank()) {
                            text.append(partText);
                        }
                    }
                }
            }
            return text.toString();
        }
        return "";
    }

    private Map<String, Object> parseJsonObject(String outputText) {
        if (outputText == null || outputText.isBlank()) {
            return new LinkedHashMap<>();
        }
        String cleaned = stripJsonFence(outputText.trim());
        try {
            return objectMapper.readValue(cleaned, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (Exception ex) {
            String objectJson = firstBalancedJsonObject(cleaned);
            if (!objectJson.isBlank()) {
                try {
                    return objectMapper.readValue(objectJson, new TypeReference<LinkedHashMap<String, Object>>() {
                    });
                } catch (Exception ignored) {
                    return new LinkedHashMap<>();
                }
            }
            return new LinkedHashMap<>();
        }
    }

    private String firstBalancedJsonObject(String text) {
        int start = text == null ? -1 : text.indexOf('{');
        if (start < 0) {
            return "";
        }
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int index = start; index < text.length(); index++) {
            char character = text.charAt(index);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (character == '\\' && inString) {
                escaped = true;
                continue;
            }
            if (character == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (character == '{') {
                depth++;
            } else if (character == '}') {
                depth--;
                if (depth == 0) {
                    return text.substring(start, index + 1);
                }
            }
        }
        return "";
    }

    private String stripJsonFence(String text) {
        String cleaned = text == null ? "" : text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```[A-Za-z0-9_-]*\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            map.forEach((key, item) -> {
                if (key != null) {
                    normalized.put(String.valueOf(key), item);
                }
            });
            return normalized;
        }
        return new LinkedHashMap<>();
    }

    private List<Map<String, Object>> listOfMaps(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object item : list) {
                Map<String, Object> map = mapValue(item);
                if (!map.isEmpty()) {
                    result.add(map);
                }
            }
            return result;
        }
        return new ArrayList<>();
    }

    private List<Map<String, Object>> copyList(List<Map<String, Object>> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> value : values) {
            result.add(value == null ? new LinkedHashMap<>() : new LinkedHashMap<>(value));
        }
        return result;
    }

    private String normalizeStatus(Object value) {
        String status = stringValue(value, "WARN").toUpperCase(Locale.ROOT).trim();
        if ("COMPLETED".equals(status) || "PASS".equals(status)) return "PASS";
        if ("FAILED".equals(status) || "FAIL".equals(status)) return "FAIL";
        return "WARN".equals(status) ? "WARN" : "WARN";
    }

    private String extensionFor(String contentType, String objectKey) {
        String normalized = stringValue(contentType, "").toLowerCase(Locale.ROOT);
        if (normalized.contains("quicktime")) return ".mov";
        if (normalized.contains("webm")) return ".webm";
        if (normalized.contains("x-matroska")) return ".mkv";
        String key = stringValue(objectKey, "").toLowerCase(Locale.ROOT);
        int dot = key.lastIndexOf('.');
        if (dot >= 0 && dot < key.length() - 1) {
            return key.substring(dot);
        }
        return ".mp4";
    }

    private void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try (var stream = Files.walk(path)) {
            stream.sorted((left, right) -> right.compareTo(left)).forEach(item -> {
                try {
                    Files.deleteIfExists(item);
                } catch (IOException ignored) {
                }
            });
        } catch (IOException ignored) {
        }
    }

    private double round3(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private double doubleValue(Object value, double fallback) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null || String.valueOf(value).isBlank()) {
            return fallback;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null || String.valueOf(value).isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private String compact(String value, int maxLength) {
        String text = value == null ? "" : value;
        return text.length() <= maxLength ? text : text.substring(0, maxLength) + "...";
    }

    private String tail(String value, int maxLength) {
        String safe = value == null ? "" : value;
        return safe.length() <= maxLength ? safe : safe.substring(safe.length() - maxLength);
    }

    private String escape(String value) {
        return stringValue(value, "").replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String stringValue(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record TranscriptCriticResult(
            boolean mediaBacked,
            String provider,
            String model,
            List<Map<String, Object>> trace,
            List<Map<String, Object>> chunkAudits,
            Map<String, Object> tokenMetadata,
            Map<String, Object> costMetadata,
            Map<String, Object> metadata
    ) {
    }

    private record ChunkAuditResult(
            Map<String, Object> audit,
            Map<String, Object> tokenMetadata
    ) {
    }
}
'@

[System.IO.File]::WriteAllText((Join-Path $base 'GoogleShortTranscriptCriticService.java'), $criticService, $utf8)

$servicePath = Join-Path $base 'CreatorShortGenerationService.java'
$text = [System.IO.File]::ReadAllText($servicePath)

if ($text -notmatch 'private final GoogleShortTranscriptCriticService transcriptCriticService;') {
  $text = [regex]::Replace($text, '    private final GoogleShortFullTranscriptWorkerService fullTranscriptWorkerService;\r?\n', "    private final GoogleShortFullTranscriptWorkerService fullTranscriptWorkerService;`r`n    private final GoogleShortTranscriptCriticService transcriptCriticService;`r`n")
}
if ($text -notmatch 'GoogleShortTranscriptCriticService transcriptCriticService,') {
  $text = [regex]::Replace($text, '            GoogleShortFullTranscriptWorkerService fullTranscriptWorkerService,\r?\n', "            GoogleShortFullTranscriptWorkerService fullTranscriptWorkerService,`r`n            GoogleShortTranscriptCriticService transcriptCriticService,`r`n")
}
if ($text -notmatch 'this\.transcriptCriticService = transcriptCriticService;') {
  $text = [regex]::Replace($text, '        this\.fullTranscriptWorkerService = fullTranscriptWorkerService;\r?\n', "        this.fullTranscriptWorkerService = fullTranscriptWorkerService;`r`n        this.transcriptCriticService = transcriptCriticService;`r`n")
}

$old = @'
        GoogleShortFullTranscriptWorkerService.FullTranscriptResult fullTranscript = fullTranscriptWorkerService.transcribe(video, sourceAsset);
        trace.addAll(fullTranscript.trace());
        if (fullTranscript.mediaBacked()) {
            creatorAiService.publishProviderUsageDebit(
                    "SHORTS_FULL_TRANSCRIPT",
                    fullTranscript.provider(),
                    fullTranscript.model(),
                    fullTranscript.costMetadata(),
                    usageContext,
                    "Google Gemini full audio transcript worker for shorts"
            );
        }
        generationJobService.updateGenerationJobProgress(jobId, 45, "Full transcript worker complete", Map.of(
                "activeStage", "TRANSCRIPT",
                "mediaBackedTranscript", fullTranscript.mediaBacked(),
                "transcriptNodeCount", fullTranscript.transcript().size(),
                "tokenMetadata", fullTranscript.tokenMetadata(),
                "trace", trace
        ));

        List<Map<String, Object>> transcriptForScenes = fullTranscript.transcript().isEmpty()
                ? new ArrayList<>(understanding.transcript())
                : new ArrayList<>(fullTranscript.transcript());
'@
$new = @'
        GoogleShortFullTranscriptWorkerService.FullTranscriptResult fullTranscript = fullTranscriptWorkerService.transcribe(video, sourceAsset);
        trace.addAll(withoutTraceStage(fullTranscript.trace(), "TRANSCRIPT_CRITIC"));
        if (fullTranscript.mediaBacked()) {
            creatorAiService.publishProviderUsageDebit(
                    "SHORTS_FULL_TRANSCRIPT",
                    fullTranscript.provider(),
                    fullTranscript.model(),
                    fullTranscript.costMetadata(),
                    usageContext,
                    "Google Gemini full audio transcript worker for shorts"
            );
        }
        generationJobService.updateGenerationJobProgress(jobId, 45, "Full transcript worker complete", Map.of(
                "activeStage", "TRANSCRIPT",
                "mediaBackedTranscript", fullTranscript.mediaBacked(),
                "transcriptNodeCount", fullTranscript.transcript().size(),
                "tokenMetadata", fullTranscript.tokenMetadata(),
                "trace", trace
        ));

        List<Map<String, Object>> transcriptForScenes = fullTranscript.transcript().isEmpty()
                ? new ArrayList<>(understanding.transcript())
                : new ArrayList<>(fullTranscript.transcript());
        GoogleShortTranscriptCriticService.TranscriptCriticResult transcriptCritic = transcriptCriticService.critique(video, sourceAsset, transcriptForScenes);
        trace.addAll(transcriptCritic.trace());
        if (transcriptCritic.mediaBacked()) {
            creatorAiService.publishProviderUsageDebit(
                    "SHORTS_TRANSCRIPT_CRITIC",
                    transcriptCritic.provider(),
                    transcriptCritic.model(),
                    transcriptCritic.costMetadata(),
                    usageContext,
                    "Google Gemini deep transcript critic for shorts"
            );
        }
        generationJobService.updateGenerationJobProgress(jobId, 49, "Deep transcript critic complete", Map.of(
                "activeStage", "TRANSCRIPT_CRITIC",
                "mediaBackedTranscriptCritic", transcriptCritic.mediaBacked(),
                "transcriptCritic", transcriptCritic.metadata(),
                "trace", trace
        ));
'@
if (-not $text.Contains($old)) {
  throw 'Could not find full transcript block to replace.'
}
$text = $text.Replace($old, $new)

$text = $text.Replace(
'        Map<String, Object> aiInput = buildAiInput(video, sourceAsset, request, understanding, fullTranscript, sceneAnalysis, graphBuild);',
'        Map<String, Object> aiInput = buildAiInput(video, sourceAsset, request, understanding, fullTranscript, transcriptCritic, sceneAnalysis, graphBuild);'
)
$text = $text.Replace(
'            GoogleShortFullTranscriptWorkerService.FullTranscriptResult fullTranscript,
            ShortSceneAnalysisService.SceneAnalysisResult sceneAnalysis,',
'            GoogleShortFullTranscriptWorkerService.FullTranscriptResult fullTranscript,
            GoogleShortTranscriptCriticService.TranscriptCriticResult transcriptCritic,
            ShortSceneAnalysisService.SceneAnalysisResult sceneAnalysis,'
)
$text = $text.Replace(
'        variables.put("fullTranscriptWorker", Map.of(
                "mediaBacked", fullTranscript.mediaBacked(),
                "metadata", fullTranscript.metadata(),
                "transcript", fullTranscript.transcript()
        ));
        variables.put("sceneAnalysis", Map.of(',
'        variables.put("fullTranscriptWorker", Map.of(
                "mediaBacked", fullTranscript.mediaBacked(),
                "metadata", fullTranscript.metadata(),
                "transcript", fullTranscript.transcript()
        ));
        variables.put("deepTranscriptCritic", Map.of(
                "mediaBacked", transcriptCritic.mediaBacked(),
                "metadata", transcriptCritic.metadata(),
                "chunkAudits", transcriptCritic.chunkAudits()
        ));
        variables.put("sceneAnalysis", Map.of('
)
$text = $text.Replace(
'                - Full transcript worker over extracted chunked audio.
                - FFmpeg scene analysis with representative source frames.',
'                - Full transcript worker over extracted chunked audio.
                - Deep transcript critic that re-checks each audio chunk against the generated transcript.
                - FFmpeg scene analysis with representative source frames.'
)
$text = $text.Replace(
'                Treat fullTranscriptWorker.transcript, sceneAnalysis.transcript, and realGraph as source of truth. Do not replace real transcript or real graph with invented placeholders; only enrich candidate selection, hooks, captions, ranking, and review guidance.',
'                Treat fullTranscriptWorker.transcript, deepTranscriptCritic.metadata, sceneAnalysis.transcript, and realGraph as source of truth. Do not replace real transcript or real graph with invented placeholders; only enrich candidate selection, hooks, captions, ranking, and review guidance.'
)
$text = $text.Replace(
'        metadata.put("fullTranscriptWorker", Map.of(
                "mediaBacked", fullTranscript.mediaBacked(),
                "provider", fullTranscript.provider(),
                "model", fullTranscript.model(),
                "tokenMetadata", fullTranscript.tokenMetadata(),
                "costMetadata", fullTranscript.costMetadata(),
                "metadata", fullTranscript.metadata()
        ));
        metadata.put("sceneAnalysis", Map.of(',
'        metadata.put("fullTranscriptWorker", Map.of(
                "mediaBacked", fullTranscript.mediaBacked(),
                "provider", fullTranscript.provider(),
                "model", fullTranscript.model(),
                "tokenMetadata", fullTranscript.tokenMetadata(),
                "costMetadata", fullTranscript.costMetadata(),
                "metadata", fullTranscript.metadata()
        ));
        metadata.put("deepTranscriptCritic", Map.of(
                "mediaBacked", transcriptCritic.mediaBacked(),
                "provider", transcriptCritic.provider(),
                "model", transcriptCritic.model(),
                "tokenMetadata", transcriptCritic.tokenMetadata(),
                "costMetadata", transcriptCritic.costMetadata(),
                "metadata", transcriptCritic.metadata()
        ));
        metadata.put("sceneAnalysis", Map.of('
)

$helper = @'
    private List<Map<String, Object>> withoutTraceStage(List<Map<String, Object>> trace, String stage) {
        if (trace == null || trace.isEmpty()) {
            return List.of();
        }
        String normalizedStage = stringValue(stage).toUpperCase(Locale.ROOT);
        return trace.stream()
                .filter(row -> !normalizedStage.equals(stringValue(row.get("stage")).toUpperCase(Locale.ROOT)))
                .toList();
    }

'@
if ($text -notmatch 'withoutTraceStage') {
  $text = $text.Replace('    private void failVideo(UUID videoId, UUID jobId, String message) {', $helper + '    private void failVideo(UUID videoId, UUID jobId, String message) {')
}

[System.IO.File]::WriteAllText($servicePath, $text, $utf8)
