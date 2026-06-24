$ErrorActionPreference = "Stop"

$backend = "C:\Users\Akash\workspace\v5\dallai-llama-backend"
$serviceDir = Join-Path $backend "creator-service\src\main\java\com\dalai\llama\creator\service"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Write-Utf8NoBom([string] $Path, [string] $Text) {
    [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
}

function Replace-Once([string] $Text, [string] $Old, [string] $New, [string] $Label) {
    if ($Text.Contains($Old)) {
        return $Text.Replace($Old, $New)
    }
    $oldLf = $Old.Replace("`r`n", "`n")
    if ($Text.Contains($oldLf)) {
        return $Text.Replace($oldLf, $New.Replace("`r`n", "`n"))
    }
    throw "Could not find patch anchor: $Label"
}

$visualSource = Join-Path (Get-Location) ".codex-tmp\ShortVisualEnhancementService.java"
$visualTarget = Join-Path $serviceDir "ShortVisualEnhancementService.java"
Write-Utf8NoBom $visualTarget ([System.IO.File]::ReadAllText($visualSource))

$generationPath = Join-Path $serviceDir "CreatorShortGenerationService.java"
$generation = [System.IO.File]::ReadAllText($generationPath)

$generation = Replace-Once $generation `
    "    private final ShortHookGenerationService hookGenerationService;`r`n    private final ShortCandidateCriticRepairService candidateCriticRepairService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "    private final ShortHookGenerationService hookGenerationService;`r`n    private final ShortCandidateCriticRepairService candidateCriticRepairService;`r`n    private final ShortVisualEnhancementService visualEnhancementService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "generation visual field"

$generation = Replace-Once $generation `
    "            ShortCompressionPlannerService compressionPlannerService,`r`n            ShortHookGenerationService hookGenerationService,`r`n            ShortCandidateCriticRepairService candidateCriticRepairService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "            ShortCompressionPlannerService compressionPlannerService,`r`n            ShortHookGenerationService hookGenerationService,`r`n            ShortCandidateCriticRepairService candidateCriticRepairService,`r`n            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "generation constructor param"

$generation = Replace-Once $generation `
    "        this.hookGenerationService = hookGenerationService;`r`n        this.candidateCriticRepairService = candidateCriticRepairService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "        this.hookGenerationService = hookGenerationService;`r`n        this.candidateCriticRepairService = candidateCriticRepairService;`r`n        this.visualEnhancementService = visualEnhancementService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "generation constructor assignment"

$generation = Replace-Once $generation `
    '        aiTrace = withoutTraceStage(withoutTraceStage(withoutTraceStage(withoutTraceStage(withoutTraceStage(aiTrace, "STORY_UNDERSTANDING"), "STORY_CRITIC"), "INTERESTINGNESS"), "INTERESTINGNESS_CRITIC"), "HOOK_GENERATION");' `
    "        aiTrace = withoutTraceStage(aiTrace, `"STORY_UNDERSTANDING`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"STORY_CRITIC`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"INTERESTINGNESS`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"INTERESTINGNESS_CRITIC`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"HOOK_GENERATION`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_ENHANCEMENT`");" `
    "generation ai trace filter"

$generation = Replace-Once $generation `
    "        generationJobService.updateGenerationJobProgress(jobId, 82, `"Short candidates compressed, critiqued, and repaired`", Map.of(`r`n                `"videoDna`", videoDna,`r`n                `"graph`", graph,`r`n                `"compressionPlanCount`", compressionPlanning.plans().size(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "        generationJobService.updateGenerationJobProgress(jobId, 82, `"Short candidates compressed, critiqued, and repaired`", Map.of(`r`n                `"videoDna`", videoDna,`r`n                `"graph`", graph,`r`n                `"compressionPlanCount`", compressionPlanning.plans().size(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        ShortVisualEnhancementService.VisualEnhancementResult visualEnhancement = visualEnhancementService.enhance(`r`n                video,`r`n                videoDna,`r`n                transcript,`r`n                graph,`r`n                candidatePayloads,`r`n                sceneAnalysis.scenes(),`r`n                sceneAnalysis.frames(),`r`n                sceneCritic.sceneCritic()`r`n        );`r`n        candidatePayloads = visualEnhancement.candidates();`r`n        trace.addAll(visualEnhancement.trace());`r`n        generationJobService.updateGenerationJobProgress(jobId, 86, `"Visual enhancement plans generated`", Map.of(`r`n                `"activeStage`", `"VISUAL_ENHANCEMENT`",`r`n                `"visualEnhancement`", visualEnhancement.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "generation visual stage"

$generation = Replace-Once $generation `
    "        metadata.put(`"hookGeneration`", hookGeneration.metadata());`r`n        metadata.put(`"criticRepairWorkers`", criticRepair.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "        metadata.put(`"hookGeneration`", hookGeneration.metadata());`r`n        metadata.put(`"criticRepairWorkers`", criticRepair.metadata());`r`n        metadata.put(`"visualEnhancement`", visualEnhancement.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "generation metadata"

Write-Utf8NoBom $generationPath $generation

$rendererPath = Join-Path $serviceDir "ShortRenderingService.java"
$renderer = [System.IO.File]::ReadAllText($rendererPath)

$renderer = Replace-Once $renderer `
    "        Map<String, Object> renderManifest = mapValue(candidate.getRenderManifest());`r`n        Dimensions target = targetDimensions(stringValue(renderManifest.get(`"aspectRatio`"), aspectRatioFor(video)));" `
    "        Map<String, Object> renderManifest = mapValue(candidate.getRenderManifest());`r`n        Map<String, Object> visualPlan = mapValue(renderManifest.get(`"visualEnhancementPlan`"));`r`n        Dimensions target = targetDimensions(stringValue(firstNonEmpty(visualPlan.get(`"aspectRatio`"), renderManifest.get(`"aspectRatio`")), aspectRatioFor(video)));" `
    "renderer visual plan target"

$renderer = Replace-Once $renderer `
    "            Path output = candidateDir.resolve(`"segment-%03d.mp4`".formatted(index));`r`n            normalizeSegment(sourcePath, output, target, sourceStart, sourceEnd, sourceHasAudio);`r`n            normalizedSegments.add(output);`r`n            Map<String, Object> segmentMetadata = new LinkedHashMap<>(segment);`r`n            segmentMetadata.put(`"renderedSegmentFile`", output.getFileName().toString());`r`n            segmentMetadata.put(`"renderedDurationSeconds`", round3(sourceEnd - sourceStart));" `
    "            Path output = candidateDir.resolve(`"segment-%03d.mp4`".formatted(index));`r`n            Map<String, Object> segmentVisualPlan = segmentVisualPlan(visualPlan, index, segment);`r`n            normalizeSegment(sourcePath, output, target, sourceStart, sourceEnd, sourceHasAudio, visualPlan, segmentVisualPlan);`r`n            normalizedSegments.add(output);`r`n            Map<String, Object> segmentMetadata = new LinkedHashMap<>(segment);`r`n            segmentMetadata.put(`"renderedSegmentFile`", output.getFileName().toString());`r`n            segmentMetadata.put(`"renderedDurationSeconds`", round3(sourceEnd - sourceStart));`r`n            segmentMetadata.put(`"visualEnhancementApplied`", !visualPlan.isEmpty());`r`n            segmentMetadata.put(`"visualEnhancementProfile`", stringValue(firstNonEmpty(segmentVisualPlan.get(`"filterProfile`"), visualPlan.get(`"filterProfile`")), `"balanced_social`"));`r`n            segmentMetadata.put(`"visualEnhancementLayout`", stringValue(firstNonEmpty(segmentVisualPlan.get(`"layoutMode`"), visualPlan.get(`"layoutMode`")), `"fill_crop`"));" `
    "renderer normalize segment call"

$renderer = Replace-Once $renderer `
    "        writeCaptions(candidate, target, assFile);" `
    "        writeCaptions(candidate, target, assFile, visualPlan);" `
    "renderer caption call"

$renderer = Replace-Once $renderer `
    "        assetMetadata.put(`"captionPlan`", candidate.getCaptionPlan());`r`n        assetMetadata.put(`"renderedAt`", OffsetDateTime.now().toString());" `
    "        assetMetadata.put(`"captionPlan`", candidate.getCaptionPlan());`r`n        assetMetadata.put(`"visualEnhancementApplied`", !visualPlan.isEmpty());`r`n        assetMetadata.put(`"visualEnhancementPlan`", visualPlan);`r`n        assetMetadata.put(`"renderedAt`", OffsetDateTime.now().toString());" `
    "renderer asset metadata"

$renderer = Replace-Once $renderer `
    "        updatedManifest.put(`"renderedAt`", OffsetDateTime.now().toString());`r`n        updatedManifest.put(`"renderedSegments`", renderedSegments);" `
    "        updatedManifest.put(`"renderedAt`", OffsetDateTime.now().toString());`r`n        updatedManifest.put(`"renderedSegments`", renderedSegments);`r`n        updatedManifest.put(`"visualEnhancementStatus`", visualPlan.isEmpty() ? `"MISSING`" : `"APPLIED`");`r`n        updatedManifest.put(`"visualEnhancementPlan`", visualPlan);" `
    "renderer manifest metadata"

$renderer = Replace-Once $renderer `
    "        metadata.put(`"renderedAssetUrl`", stored.signedUrl());`r`n        metadata.put(`"renderingStatus`", `"RENDERED`");" `
    "        metadata.put(`"renderedAssetUrl`", stored.signedUrl());`r`n        metadata.put(`"renderingStatus`", `"RENDERED`");`r`n        metadata.put(`"visualEnhancementApplied`", !visualPlan.isEmpty());`r`n        metadata.put(`"visualEnhancementProfile`", stringValue(visualPlan.get(`"filterProfile`"), `"`"));" `
    "renderer candidate metadata"

$newNormalize = @'
    private void normalizeSegment(
            Path sourcePath,
            Path output,
            Dimensions target,
            double sourceStart,
            double sourceEnd,
            boolean sourceHasAudio,
            Map<String, Object> visualPlan,
            Map<String, Object> segmentVisualPlan
    ) {
        double duration = Math.max(0.1, sourceEnd - sourceStart);
        List<String> command = new ArrayList<>();
        command.add("ffmpeg");
        command.add("-hide_banner");
        command.add("-y");
        command.add("-ss");
        command.add(formatSeconds(sourceStart));
        command.add("-t");
        command.add(formatSeconds(duration));
        command.add("-i");
        command.add(sourcePath.toString());
        if (!sourceHasAudio) {
            command.add("-f");
            command.add("lavfi");
            command.add("-t");
            command.add(formatSeconds(duration));
            command.add("-i");
            command.add("anullsrc=channel_layout=stereo:sample_rate=48000");
        }
        command.add("-map");
        command.add("0:v:0");
        command.add("-map");
        command.add(sourceHasAudio ? "0:a?" : "1:a:0");
        command.add("-vf");
        command.add(videoFilter(target, visualPlan, segmentVisualPlan));
        command.add("-r");
        command.add("30");
        command.add("-c:v");
        command.add("libx264");
        command.add("-preset");
        command.add("veryfast");
        command.add("-crf");
        command.add("21");
        command.add("-pix_fmt");
        command.add("yuv420p");
        command.add("-c:a");
        command.add("aac");
        command.add("-b:a");
        command.add("160k");
        command.add("-ar");
        command.add("48000");
        command.add("-ac");
        command.add("2");
        command.add("-shortest");
        command.add("-movflags");
        command.add("+faststart");
        command.add(output.toString());
        run(command, output.resolveSibling(output.getFileName() + ".log"), "FFmpeg short segment normalization failed");
    }
'@

$renderer = [System.Text.RegularExpressions.Regex]::Replace(
    $renderer,
    '(?s)    private void normalizeSegment\(Path sourcePath.*?\r?\n    private void writeCaptions',
    $newNormalize + "`r`n`r`n    private void writeCaptions"
)

$newWriteCaptions = @'
    private void writeCaptions(CreatorShortCandidate candidate, Dimensions target, Path assFile, Map<String, Object> visualPlan) {
        List<Map<String, Object>> captions = listOfMaps(mapValue(candidate.getCaptionPlan()).get("captions"));
        Map<String, Object> captionStyle = mapValue(visualPlan.get("captionStyle"));
        String fontName = assStyleValue(captionStyle.get("fontName"), "Arial");
        int fontSize = intValue(captionStyle.get("fontSize"), Math.max(42, Math.min(74, target.height() / 26)));
        int bottomMargin = intValue(captionStyle.get("bottomMargin"), Math.max(120, target.height() / 9));
        int leftMargin = intValue(captionStyle.get("leftMargin"), 80);
        int rightMargin = intValue(captionStyle.get("rightMargin"), 80);
        int alignment = intValue(captionStyle.get("alignment"), 2);
        double outline = doubleValue(captionStyle.get("outline"), 4.0);
        double shadow = doubleValue(captionStyle.get("shadow"), 2.0);
        int maxCharsPerLine = intValue(captionStyle.get("maxCharsPerLine"), 28);

        StringBuilder builder = new StringBuilder();
        builder.append("[Script Info]\n");
        builder.append("ScriptType: v4.00+\n");
        builder.append("PlayResX: ").append(target.width()).append('\n');
        builder.append("PlayResY: ").append(target.height()).append("\n\n");
        builder.append("[V4+ Styles]\n");
        builder.append("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n");
        builder.append("Style: Default,")
                .append(fontName)
                .append(',')
                .append(fontSize)
                .append(",&H00FFFFFF,&H000000FF,&H90000000,&H80000000,1,0,0,0,100,100,0,0,1,")
                .append(formatFilterDouble(outline))
                .append(',')
                .append(formatFilterDouble(shadow))
                .append(',')
                .append(alignment)
                .append(',')
                .append(leftMargin)
                .append(',')
                .append(rightMargin)
                .append(',')
                .append(bottomMargin)
                .append(",1\n\n");
        builder.append("[Events]\n");
        builder.append("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n");
        for (Map<String, Object> caption : captions) {
            double start = Math.max(0.0, doubleValue(caption.get("start"), 0.0));
            double end = Math.max(start + 0.5, doubleValue(caption.get("end"), start + 2.0));
            String text = assEscape(wrapCaption(stringValue(caption.get("text"), ""), maxCharsPerLine));
            if (text.isBlank()) {
                continue;
            }
            builder.append("Dialogue: 0,")
                    .append(assTime(start))
                    .append(',')
                    .append(assTime(end))
                    .append(",Default,,0,0,0,,")
                    .append(text)
                    .append('\n');
        }
        try {
            Files.writeString(assFile, builder.toString());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not write short caption file.", ex);
        }
    }
'@

$renderer = [System.Text.RegularExpressions.Regex]::Replace(
    $renderer,
    '(?s)    private void writeCaptions\(CreatorShortCandidate candidate.*?\r?\n    private void applyCaptions',
    $newWriteCaptions + "`r`n`r`n    private void applyCaptions"
)

$visualHelpers = @'
    private Map<String, Object> segmentVisualPlan(Map<String, Object> visualPlan, int index, Map<String, Object> segment) {
        for (Map<String, Object> plan : listOfMaps(visualPlan.get("segmentPlans"))) {
            if (intValue(plan.get("index"), -1) == index) {
                return plan;
            }
            String planNodeId = stringValue(plan.get("nodeId"), "");
            String segmentNodeId = stringValue(segment.get("nodeId"), "");
            if (!planNodeId.isBlank() && planNodeId.equals(segmentNodeId)) {
                return plan;
            }
        }
        return new LinkedHashMap<>();
    }

    private String videoFilter(Dimensions target, Map<String, Object> visualPlan, Map<String, Object> segmentVisualPlan) {
        Map<String, Object> enhancements = mapValue(visualPlan.get("enhancements"));
        List<String> filters = new ArrayList<>();
        filters.add(layoutFilter(target, visualPlan, segmentVisualPlan));

        if (booleanValue(enhancements.get("denoise"), false)) {
            double lumaSpatial = clamp(doubleValue(enhancements.get("denoiseLumaSpatial"), 0.8), 0.0, 3.0);
            double chromaSpatial = clamp(doubleValue(enhancements.get("denoiseChromaSpatial"), 0.6), 0.0, 3.0);
            double lumaTemporal = clamp(doubleValue(enhancements.get("denoiseLumaTemporal"), 2.8), 0.0, 8.0);
            double chromaTemporal = clamp(doubleValue(enhancements.get("denoiseChromaTemporal"), 2.1), 0.0, 8.0);
            filters.add("hqdn3d=%s:%s:%s:%s".formatted(
                    formatFilterDouble(lumaSpatial),
                    formatFilterDouble(chromaSpatial),
                    formatFilterDouble(lumaTemporal),
                    formatFilterDouble(chromaTemporal)
            ));
        }

        double contrast = clamp(doubleValue(enhancements.get("contrast"), 1.0), 0.8, 1.35);
        double saturation = clamp(doubleValue(enhancements.get("saturation"), 1.0), 0.7, 1.45);
        double brightness = clamp(doubleValue(enhancements.get("brightness"), 0.0), -0.12, 0.12);
        double gamma = clamp(doubleValue(enhancements.get("gamma"), 1.0), 0.75, 1.35);
        if (Math.abs(contrast - 1.0) > 0.001 || Math.abs(saturation - 1.0) > 0.001 || Math.abs(brightness) > 0.001 || Math.abs(gamma - 1.0) > 0.001) {
            filters.add("eq=contrast=%s:saturation=%s:brightness=%s:gamma=%s".formatted(
                    formatFilterDouble(contrast),
                    formatFilterDouble(saturation),
                    formatFilterDouble(brightness),
                    formatFilterDouble(gamma)
            ));
        }

        if (booleanValue(enhancements.get("sharpen"), false)) {
            double amount = clamp(doubleValue(enhancements.get("sharpenAmount"), 0.4), 0.0, 0.9);
            if (amount > 0.0) {
                filters.add("unsharp=5:5:%s:3:3:%s".formatted(formatFilterDouble(amount), formatFilterDouble(Math.max(0.0, amount / 2.0))));
            }
        }

        if (booleanValue(enhancements.get("deband"), false)) {
            filters.add("deband");
        }
        return String.join(",", filters);
    }

    private String layoutFilter(Dimensions target, Map<String, Object> visualPlan, Map<String, Object> segmentVisualPlan) {
        String layoutMode = stringValue(firstNonEmpty(segmentVisualPlan.get("layoutMode"), visualPlan.get("layoutMode")), "fill_crop")
                .toLowerCase(Locale.ROOT);
        if (layoutMode.contains("fit") || layoutMode.contains("pad")) {
            return "scale=w=%d:h=%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1"
                    .formatted(target.width(), target.height(), target.width(), target.height());
        }
        return "scale=w=%d:h=%d:force_original_aspect_ratio=increase,crop=%d:%d:(in_w-out_w)/2:(in_h-out_h)/2,setsar=1"
                .formatted(target.width(), target.height(), target.width(), target.height());
    }

'@

$renderer = Replace-Once $renderer `
    "    private boolean hasAudio(Path input) {" `
    ($visualHelpers + "    private boolean hasAudio(Path input) {") `
    "renderer visual helpers"

$helperMethods = @'
    private Object firstNonEmpty(Object... values) {
        if (values == null) {
            return null;
        }
        for (Object value : values) {
            if (value != null && !String.valueOf(value).isBlank()) {
                return value;
            }
        }
        return null;
    }

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null && !String.valueOf(value).isBlank()) {
            try {
                return Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private boolean booleanValue(Object value, boolean fallback) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof Number number) {
            return number.intValue() != 0;
        }
        if (value != null && !String.valueOf(value).isBlank()) {
            String normalized = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
            if (List.of("true", "yes", "1", "on").contains(normalized)) {
                return true;
            }
            if (List.of("false", "no", "0", "off").contains(normalized)) {
                return false;
            }
        }
        return fallback;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private String formatFilterDouble(double value) {
        return String.format(Locale.ROOT, "%.3f", value);
    }

    private String assStyleValue(Object value, String fallback) {
        return stringValue(value, fallback)
                .replace(",", " ")
                .replace("\r", " ")
                .replace("\n", " ")
                .trim();
    }

'@

$renderer = Replace-Once $renderer `
    "    private double doubleValue(Object value, double fallback) {" `
    ($helperMethods + "    private double doubleValue(Object value, double fallback) {") `
    "renderer helper methods"

Write-Utf8NoBom $rendererPath $renderer

Write-Host "Visual enhancement backend patch applied."
