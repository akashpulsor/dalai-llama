$ErrorActionPreference = "Stop"

$root = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator"
$servicePath = Join-Path $root "service\CreatorShortGenerationService.java"
$storagePath = Join-Path $root "service\AssetStorageService.java"
$controllerPath = Join-Path $root "controller\CreatorShortGenerationController.java"
$requestDir = Join-Path $root "dto\request"
$responseDir = Join-Path $root "dto\response"

Set-Content -Path (Join-Path $requestDir "ShortUploadSessionRequest.java") -Value @'
package com.dalai.llama.creator.dto.request;

public record ShortUploadSessionRequest(
        String originalFilename,
        String contentType,
        Long sizeBytes,
        Integer totalChunks,
        Long chunkSizeBytes
) {
}
'@ -NoNewline

Set-Content -Path (Join-Path $requestDir "CompleteShortUploadRequest.java") -Value @'
package com.dalai.llama.creator.dto.request;

import java.util.UUID;

public record CompleteShortUploadRequest(
        UUID projectId,
        String title,
        String platform,
        Integer targetDurationSeconds,
        Integer requestedShorts,
        String reviewMode,
        String creatorProfileJson,
        String notes,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        Integer totalChunks
) {
    public GenerateShortsRequest toGenerateShortsRequest() {
        return new GenerateShortsRequest(
                projectId,
                title,
                platform,
                targetDurationSeconds,
                requestedShorts,
                reviewMode,
                creatorProfileJson,
                notes
        );
    }
}
'@ -NoNewline

Set-Content -Path (Join-Path $responseDir "ShortUploadSessionResponse.java") -Value @'
package com.dalai.llama.creator.dto.response;

import java.util.List;
import java.util.UUID;

public record ShortUploadSessionResponse(
        UUID uploadId,
        String status,
        Integer chunkIndex,
        Integer totalChunks,
        Long chunkSizeBytes,
        Long maxChunkSizeBytes,
        Long receivedBytes,
        List<Integer> missingChunks,
        String message
) {
}
'@ -NoNewline

$storage = Get-Content -Raw -Path $storagePath
$storage = $storage.Replace("import software.amazon.awssdk.services.s3.model.GetObjectRequest;`r`n", "import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;`r`nimport software.amazon.awssdk.services.s3.model.GetObjectRequest;`r`nimport software.amazon.awssdk.services.s3.model.HeadObjectRequest;`r`n")
$storage = $storage.Replace("import java.nio.file.Path;`r`n", "import java.io.IOException;`r`nimport java.io.OutputStream;`r`nimport java.nio.file.Files;`r`nimport java.nio.file.Path;`r`n")
$anchor = @'
    public StoredObject uploadCreatorAsset(String objectKey, byte[] bytes, String contentType, Duration signedUrlTtl) {
        String bucket = creatorAssetsBucket();
        ensureBucket(bucket);
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes)
        );
        return new StoredObject(
                bucket,
                objectKey,
                contentType,
                (long) bytes.length,
                signedUrl(bucket, objectKey, signedUrlTtl)
        );
    }
'@
$replacement = @'
    public StoredObject uploadCreatorAsset(String objectKey, byte[] bytes, String contentType, Duration signedUrlTtl) {
        String bucket = creatorAssetsBucket();
        ensureBucket(bucket);
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes)
        );
        return new StoredObject(
                bucket,
                objectKey,
                contentType,
                (long) bytes.length,
                signedUrl(bucket, objectKey, signedUrlTtl)
        );
    }

    public StoredObject uploadCreatorAssetFromPath(String objectKey, Path sourcePath, String contentType, Duration signedUrlTtl) {
        String bucket = creatorAssetsBucket();
        ensureBucket(bucket);
        try {
            long size = Files.size(sourcePath);
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(objectKey)
                            .contentType(contentType)
                            .contentLength(size)
                            .build(),
                    RequestBody.fromFile(sourcePath)
            );
            return new StoredObject(bucket, objectKey, contentType, size, signedUrl(bucket, objectKey, signedUrlTtl));
        } catch (IOException ex) {
            throw new IllegalStateException("Could not read source file for upload.", ex);
        }
    }

    public StoredObject putCreatorObject(String objectKey, byte[] bytes, String contentType) {
        String bucket = creatorAssetsBucket();
        ensureBucket(bucket);
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes)
        );
        return new StoredObject(bucket, objectKey, contentType, (long) bytes.length, "");
    }

    public void downloadCreatorObjectToOutputStream(String objectKey, OutputStream outputStream) throws IOException {
        downloadObjectToOutputStream(creatorAssetsBucket(), objectKey, outputStream);
    }

    public void downloadObjectToOutputStream(String bucket, String objectKey, OutputStream outputStream) throws IOException {
        try (var inputStream = s3Client.getObject(GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build())) {
            inputStream.transferTo(outputStream);
        }
    }

    public boolean creatorObjectExists(String objectKey) {
        String bucket = creatorAssetsBucket();
        ensureBucket(bucket);
        try {
            s3Client.headObject(HeadObjectRequest.builder().bucket(bucket).key(objectKey).build());
            return true;
        } catch (S3Exception ex) {
            if (ex.statusCode() == 404) {
                return false;
            }
            throw ex;
        }
    }

    public void deleteCreatorObject(String objectKey) {
        String bucket = creatorAssetsBucket();
        ensureBucket(bucket);
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(objectKey).build());
    }
'@
if (-not $storage.Contains($anchor)) { throw "AssetStorageService upload anchor not found" }
$storage = $storage.Replace($anchor, $replacement)
Set-Content -Path $storagePath -Value $storage -NoNewline

$service = Get-Content -Raw -Path $servicePath
$service = $service.Replace("import com.dalai.llama.creator.dto.request.GenerateShortsRequest;`r`n", "import com.dalai.llama.creator.dto.request.CompleteShortUploadRequest;`r`nimport com.dalai.llama.creator.dto.request.GenerateShortsRequest;`r`nimport com.dalai.llama.creator.dto.request.ShortUploadSessionRequest;`r`n")
$service = $service.Replace("import com.dalai.llama.creator.dto.response.ShortGenerationResponse;`r`n", "import com.dalai.llama.creator.dto.response.ShortGenerationResponse;`r`nimport com.dalai.llama.creator.dto.response.ShortUploadSessionResponse;`r`n")
$service = $service.Replace("import org.springframework.http.HttpStatus;`r`n", "import org.slf4j.Logger;`r`nimport org.slf4j.LoggerFactory;`r`nimport org.springframework.http.HttpStatus;`r`n")
$service = $service.Replace("import java.io.IOException;`r`n", "import java.io.IOException;`r`nimport java.io.OutputStream;`r`n")
$service = $service.Replace("    private static final Duration SIGNED_URL_TTL = Duration.ofDays(7);`r`n", "    private static final Logger log = LoggerFactory.getLogger(CreatorShortGenerationService.class);`r`n    private static final Duration SIGNED_URL_TTL = Duration.ofDays(7);`r`n    private static final long DEFAULT_CHUNK_SIZE_BYTES = 8L * 1024L * 1024L;`r`n    private static final long MAX_CHUNK_SIZE_BYTES = 64L * 1024L * 1024L;`r`n    private static final int MAX_CHUNK_COUNT = 10000;`r`n")

$pattern = '(?s)    public ShortGenerationResponse startGeneration\(MultipartFile file, GenerateShortsRequest request, String tenantId, String userId\) \{.*?\r?\n    public void runQueuedGenerationJob'
$replacement = @'
    public ShortGenerationResponse startGeneration(MultipartFile file, GenerateShortsRequest request, String tenantId, String userId) {
        String safeTenantId = safeTenantId(tenantId);
        String safeUserId = safeUserId(userId);
        GenerateShortsRequest safeRequest = safeGenerateRequest(request);

        validateUpload(file);
        assertWalletBalance(safeRequest, safeTenantId, safeUserId);

        UUID videoId = UUID.randomUUID();
        String contentType = defaultString(file.getContentType(), "application/octet-stream");
        String originalFilename = defaultString(file.getOriginalFilename(), "source-video.mp4");
        String objectKey = sourceObjectKey(safeTenantId, videoId, originalFilename);

        AssetStorageService.StoredObject stored;
        try {
            stored = assetStorageService.uploadCreatorAsset(objectKey, file.getBytes(), contentType, SIGNED_URL_TTL);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded source video.", ex);
        }

        return startGenerationFromStoredSource(
                videoId,
                stored,
                originalFilename,
                safeRequest,
                safeTenantId,
                safeUserId,
                "generate_shorts_upload",
                new LinkedHashMap<>()
        );
    }

    public ShortUploadSessionResponse createChunkUpload(ShortUploadSessionRequest request, String tenantId, String userId) {
        ShortUploadSessionRequest safeRequest = request == null
                ? new ShortUploadSessionRequest(null, null, null, null, null)
                : request;
        validateVideoMetadata(
                defaultString(safeRequest.originalFilename(), "source-video.mp4"),
                defaultString(safeRequest.contentType(), "application/octet-stream")
        );
        long chunkSize = normalizeChunkSize(safeRequest.chunkSizeBytes());
        int totalChunks = normalizeTotalChunks(safeRequest.totalChunks(), safeRequest.sizeBytes(), chunkSize);
        return new ShortUploadSessionResponse(
                UUID.randomUUID(),
                "READY",
                null,
                totalChunks,
                chunkSize,
                MAX_CHUNK_SIZE_BYTES,
                0L,
                List.of(),
                "Chunk upload session created. Upload each part, then complete to merge and queue generation."
        );
    }

    public ShortUploadSessionResponse uploadChunk(
            UUID uploadId,
            int chunkIndex,
            MultipartFile chunk,
            Integer totalChunks,
            Long sizeBytes,
            String tenantId,
            String userId
    ) {
        validateUploadId(uploadId);
        int safeTotalChunks = normalizeTotalChunks(totalChunks, sizeBytes, DEFAULT_CHUNK_SIZE_BYTES);
        validateChunkIndex(chunkIndex, safeTotalChunks);
        if (chunk == null || chunk.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chunk payload is required.");
        }
        if (chunk.getSize() > MAX_CHUNK_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Chunk is too large. Use chunks of 64 MB or less.");
        }
        try {
            String objectKey = chunkObjectKey(safeTenantId(tenantId), safeUserId(userId), uploadId, chunkIndex);
            assetStorageService.putCreatorObject(objectKey, chunk.getBytes(), "application/octet-stream");
            return new ShortUploadSessionResponse(
                    uploadId,
                    "PART_UPLOADED",
                    chunkIndex,
                    safeTotalChunks,
                    chunk.getSize(),
                    MAX_CHUNK_SIZE_BYTES,
                    chunk.getSize(),
                    List.of(),
                    "Chunk " + (chunkIndex + 1) + "/" + safeTotalChunks + " uploaded."
            );
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded chunk.", ex);
        }
    }

    public ShortGenerationResponse completeChunkUpload(
            UUID uploadId,
            CompleteShortUploadRequest request,
            String tenantId,
            String userId
    ) {
        validateUploadId(uploadId);
        CompleteShortUploadRequest safeCompleteRequest = request == null
                ? new CompleteShortUploadRequest(null, null, null, null, null, null, null, null, null, null, null, null)
                : request;
        GenerateShortsRequest safeRequest = safeGenerateRequest(safeCompleteRequest.toGenerateShortsRequest());
        String safeTenantId = safeTenantId(tenantId);
        String safeUserId = safeUserId(userId);
        String originalFilename = defaultString(safeCompleteRequest.originalFilename(), "source-video.mp4");
        String contentType = defaultString(safeCompleteRequest.contentType(), "application/octet-stream");
        validateVideoMetadata(originalFilename, contentType);
        int totalChunks = normalizeTotalChunks(safeCompleteRequest.totalChunks(), safeCompleteRequest.sizeBytes(), DEFAULT_CHUNK_SIZE_BYTES);
        assertWalletBalance(safeRequest, safeTenantId, safeUserId);

        UUID videoId = UUID.randomUUID();
        Path mergedPath = null;
        try {
            mergedPath = Files.createTempFile("creator-short-source-" + uploadId + "-", "." + defaultString(extension(originalFilename), "mp4"));
            long mergedSizeBytes = mergeChunkUploadToPath(safeTenantId, safeUserId, uploadId, totalChunks, mergedPath);
            Long declaredSize = safeCompleteRequest.sizeBytes();
            if (declaredSize != null && declaredSize > 0 && mergedSizeBytes != declaredSize) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Merged upload size mismatch. Expected " + declaredSize + " bytes but received " + mergedSizeBytes + "."
                );
            }
            AssetStorageService.StoredObject stored = assetStorageService.uploadCreatorAssetFromPath(
                    sourceObjectKey(safeTenantId, videoId, originalFilename),
                    mergedPath,
                    contentType,
                    SIGNED_URL_TTL
            );
            Map<String, Object> uploadMetadata = new LinkedHashMap<>();
            uploadMetadata.put("chunkedUpload", true);
            uploadMetadata.put("uploadId", uploadId.toString());
            uploadMetadata.put("totalChunks", totalChunks);
            uploadMetadata.put("declaredSizeBytes", declaredSize == null ? 0L : declaredSize);
            uploadMetadata.put("mergedSizeBytes", mergedSizeBytes);
            ShortGenerationResponse response = startGenerationFromStoredSource(
                    videoId,
                    stored,
                    originalFilename,
                    safeRequest,
                    safeTenantId,
                    safeUserId,
                    "generate_shorts_chunk_upload",
                    uploadMetadata
            );
            deleteChunksBestEffort(safeTenantId, safeUserId, uploadId, totalChunks);
            return response;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not merge uploaded chunks.", ex);
        } finally {
            if (mergedPath != null) {
                try {
                    Files.deleteIfExists(mergedPath);
                } catch (IOException ex) {
                    log.warn("Could not delete temporary merged short upload file path={}", mergedPath, ex);
                }
            }
        }
    }

    private ShortGenerationResponse startGenerationFromStoredSource(
            UUID videoId,
            AssetStorageService.StoredObject stored,
            String originalFilename,
            GenerateShortsRequest safeRequest,
            String safeTenantId,
            String safeUserId,
            String sourceLabel,
            Map<String, Object> ingestionMetadata
    ) {
        Map<String, Object> settings = buildSettings(safeRequest);
        Map<String, Object> safeIngestionMetadata = new LinkedHashMap<>(ingestionMetadata == null ? Map.of() : ingestionMetadata);
        String contentType = defaultString(stored.contentType(), "application/octet-stream");

        Map<String, Object> sourceMetadata = new LinkedHashMap<>();
        sourceMetadata.putAll(safeIngestionMetadata);
        sourceMetadata.put("shortVideoId", videoId.toString());
        sourceMetadata.put("source", sourceLabel);
        sourceMetadata.put("originalFilename", originalFilename);
        sourceMetadata.put("platform", settings.get("platform"));
        sourceMetadata.put("targetDurationSeconds", settings.get("targetDurationSeconds"));
        sourceMetadata.put("requestedShorts", settings.get("requestedShorts"));
        sourceMetadata.put("reviewMode", settings.get("reviewMode"));
        sourceMetadata.put("contentType", contentType);
        sourceMetadata.put("sizeBytes", stored.sizeBytes());

        CreatorAsset sourceAsset = assetRepository.saveAndFlush(CreatorAsset.builder()
                .tenantId(safeTenantId)
                .userId(safeUserId)
                .projectId(safeRequest.projectId())
                .assetType(ASSET_TYPE_SOURCE_VIDEO)
                .bucket(stored.bucket())
                .objectKey(stored.objectKey())
                .contentType(contentType)
                .sizeBytes(stored.sizeBytes())
                .publicUrl(stored.signedUrl())
                .metadata(sourceMetadata)
                .build());

        Map<String, Object> jobInput = new LinkedHashMap<>();
        jobInput.put("shortVideoId", videoId.toString());
        jobInput.put("sourceAssetId", sourceAsset.getId().toString());
        jobInput.put("settings", settings);
        jobInput.put("pipeline", PIPELINE_STAGES);

        CreatorGenerationJob job = generationJobService.startGenerationJob(
                JOB_TYPE,
                safeTenantId,
                safeUserId,
                safeRequest.projectId(),
                jobInput
        );

        CreatorShortVideo video = CreatorShortVideo.builder()
                .id(videoId)
                .tenantId(safeTenantId)
                .userId(safeUserId)
                .projectId(safeRequest.projectId())
                .sourceAssetId(sourceAsset.getId())
                .generationJobId(job.getId())
                .title(defaultString(safeRequest.title(), stripExtension(originalFilename)))
                .originalFileName(originalFilename)
                .platform(stringValue(settings.get("platform")))
                .targetDurationSeconds(intValue(settings.get("targetDurationSeconds"), 60))
                .requestedShorts(intValue(settings.get("requestedShorts"), 20))
                .reviewMode(stringValue(settings.get("reviewMode")))
                .status("QUEUED")
                .settings(settings)
                .metadata(initialVideoMetadata(sourceAsset, stored, safeRequest, sourceLabel, safeIngestionMetadata))
                .build();
        video = videoRepository.saveAndFlush(video);

        Map<String, Object> queuePayload = shortsQueuePayload(video, sourceAsset, safeRequest);
        generationJobService.queueExistingGenerationJob(job.getId(), null, "Generate Shorts job queued", Map.of(
                "shortVideoId", video.getId().toString(),
                "sourceAssetId", sourceAsset.getId().toString(),
                "status", "QUEUED",
                "trace", List.of(Map.of(
                        "stage", "INGESTION",
                        "status", "COMPLETED",
                        "summary", "Source video stored in MinIO and queued for Generate Shorts worker.",
                        "confidence", 1.0,
                        "timestamp", OffsetDateTime.now().toString()
                ))
        ));
        generationJobService.publishExistingGenerationJob(null, job.getId(), queuePayload);

        Map<String, Object> metadata = mutableMap(video.getMetadata());
        metadata.put("queuedAt", OffsetDateTime.now().toString());
        metadata.put("queue", Map.of(
                "topic", "creator.generation.jobs",
                "jobType", JOB_TYPE,
                "sourceAssetId", sourceAsset.getId().toString()
        ));
        video.setMetadata(metadata);
        video = videoRepository.saveAndFlush(video);
        return toResponse(video);
    }

    private long mergeChunkUploadToPath(String tenantId, String userId, UUID uploadId, int totalChunks, Path mergedPath) throws IOException {
        List<Integer> missing = missingChunks(tenantId, userId, uploadId, totalChunks);
        if (!missing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload is missing chunks: " + missing.stream().limit(20).toList());
        }
        long bytes = 0L;
        try (OutputStream outputStream = Files.newOutputStream(mergedPath)) {
            for (int index = 0; index < totalChunks; index++) {
                String objectKey = chunkObjectKey(tenantId, userId, uploadId, index);
                long before = Files.size(mergedPath);
                assetStorageService.downloadCreatorObjectToOutputStream(objectKey, outputStream);
                outputStream.flush();
                bytes += Math.max(0L, Files.size(mergedPath) - before);
            }
        }
        return bytes;
    }

    private List<Integer> missingChunks(String tenantId, String userId, UUID uploadId, int totalChunks) {
        List<Integer> missing = new ArrayList<>();
        for (int index = 0; index < totalChunks; index++) {
            if (!assetStorageService.creatorObjectExists(chunkObjectKey(tenantId, userId, uploadId, index))) {
                missing.add(index);
            }
        }
        return missing;
    }

    private void deleteChunksBestEffort(String tenantId, String userId, UUID uploadId, int totalChunks) {
        for (int index = 0; index < totalChunks; index++) {
            String objectKey = chunkObjectKey(tenantId, userId, uploadId, index);
            try {
                assetStorageService.deleteCreatorObject(objectKey);
            } catch (RuntimeException ex) {
                log.warn("Could not delete uploaded short source chunk objectKey={}", objectKey, ex);
            }
        }
    }

    public void runQueuedGenerationJob
'@
if (-not [regex]::IsMatch($service, $pattern)) { throw "startGeneration block not found" }
$service = [regex]::Replace($service, $pattern, $replacement, 1)

$patternMeta = '(?s)    private Map<String, Object> initialVideoMetadata\(CreatorAsset sourceAsset, AssetStorageService\.StoredObject stored, GenerateShortsRequest request\) \{.*?\r?\n    \}'
$replacementMeta = @'
    private Map<String, Object> initialVideoMetadata(
            CreatorAsset sourceAsset,
            AssetStorageService.StoredObject stored,
            GenerateShortsRequest request,
            String sourceLabel,
            Map<String, Object> ingestionMetadata
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("sourceBucket", stored.bucket());
        metadata.put("sourceObjectKey", stored.objectKey());
        metadata.put("sourceAssetId", sourceAsset.getId().toString());
        metadata.put("sourceAssetType", ASSET_TYPE_SOURCE_VIDEO);
        metadata.put("sourceSignedUrl", stored.signedUrl());
        metadata.put("requestedAt", OffsetDateTime.now().toString());
        metadata.put("notes", defaultString(request.notes(), ""));
        metadata.put("agentContractVersion", 1);
        metadata.put("source", sourceLabel);
        if (ingestionMetadata != null && !ingestionMetadata.isEmpty()) {
            metadata.put("ingestion", new LinkedHashMap<>(ingestionMetadata));
        }
        return metadata;
    }
'@
if (-not [regex]::IsMatch($service, $patternMeta)) { throw "initialVideoMetadata block not found" }
$service = [regex]::Replace($service, $patternMeta, $replacementMeta, 1)

$insertBefore = "    private void validateUpload(MultipartFile file) {"
$helpers = @'
    private GenerateShortsRequest safeGenerateRequest(GenerateShortsRequest request) {
        return request == null
                ? new GenerateShortsRequest(null, null, null, null, null, null, null, null)
                : request;
    }

    private void assertWalletBalance(GenerateShortsRequest request, String tenantId, String userId) {
        creatorAiService.assertWalletBalanceForModelRun(
                JOB_TYPE,
                new CreatorAiService.AiUsageContext(tenantId, userId, request.projectId(), null, null)
        );
    }

'@
if (-not $service.Contains($insertBefore)) { throw "validateUpload anchor not found" }
$service = $service.Replace($insertBefore, $helpers + $insertBefore)

$oldValidate = @'
        String contentType = defaultString(file.getContentType(), "application/octet-stream").toLowerCase(Locale.ROOT);
        String filename = defaultString(file.getOriginalFilename(), "");
        boolean videoType = contentType.startsWith("video/");
        boolean octet = "application/octet-stream".equals(contentType);
        boolean videoExtension = VIDEO_EXTENSIONS.contains(extension(filename));
        if (!videoType && !(octet && videoExtension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generate Shorts expects a video upload.");
        }
    }
'@
$newValidate = @'
        validateVideoMetadata(file.getOriginalFilename(), file.getContentType());
    }

    private void validateVideoMetadata(String originalFilename, String contentTypeValue) {
        String contentType = defaultString(contentTypeValue, "application/octet-stream").toLowerCase(Locale.ROOT);
        String filename = defaultString(originalFilename, "");
        boolean videoType = contentType.startsWith("video/");
        boolean octet = "application/octet-stream".equals(contentType);
        boolean videoExtension = VIDEO_EXTENSIONS.contains(extension(filename));
        if (!videoType && !(octet && videoExtension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generate Shorts expects a video upload.");
        }
    }

    private void validateUploadId(UUID uploadId) {
        if (uploadId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload id is required.");
        }
    }

    private void validateChunkIndex(int chunkIndex, int totalChunks) {
        if (chunkIndex < 0 || chunkIndex >= totalChunks) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chunk index is outside the upload range.");
        }
    }

    private long normalizeChunkSize(Long chunkSizeBytes) {
        long chunkSize = chunkSizeBytes == null || chunkSizeBytes <= 0 ? DEFAULT_CHUNK_SIZE_BYTES : chunkSizeBytes;
        if (chunkSize > MAX_CHUNK_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Chunk size must be 64 MB or less.");
        }
        return chunkSize;
    }

    private int normalizeTotalChunks(Integer totalChunks, Long sizeBytes, long chunkSizeBytes) {
        int count = totalChunks == null || totalChunks <= 0
                ? (sizeBytes == null || sizeBytes <= 0 ? 0 : (int) Math.ceil(sizeBytes / (double) Math.max(1L, chunkSizeBytes)))
                : totalChunks;
        if (count <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total chunk count is required.");
        }
        if (count > MAX_CHUNK_COUNT) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Too many upload chunks.");
        }
        return count;
    }

    private String sourceObjectKey(String tenantId, UUID videoId, String originalFilename) {
        return "shorts/%s/%s/source/%s-%s".formatted(
                storageSegment(tenantId),
                DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now()),
                videoId,
                sanitizeFilename(originalFilename)
        );
    }

    private String chunkObjectKey(String tenantId, String userId, UUID uploadId, int chunkIndex) {
        return "short-uploads/%s/%s/%s/chunks/%05d.part".formatted(
                storageSegment(tenantId),
                storageSegment(userId),
                uploadId,
                chunkIndex
        );
    }

    private String storageSegment(String value) {
        String safe = defaultString(value, "unknown")
                .replaceAll("[^A-Za-z0-9._-]", "-")
                .replaceAll("-+", "-");
        if (safe.length() > 96) {
            return safe.substring(0, 96);
        }
        return safe;
    }
'@
if (-not $service.Contains($oldValidate)) { throw "validateUpload body not found" }
$service = $service.Replace($oldValidate, $newValidate)
Set-Content -Path $servicePath -Value $service -NoNewline

$controller = Get-Content -Raw -Path $controllerPath
$controller = $controller.Replace("import com.dalai.llama.creator.dto.request.GenerateShortsRequest;`r`n", "import com.dalai.llama.creator.dto.request.CompleteShortUploadRequest;`r`nimport com.dalai.llama.creator.dto.request.GenerateShortsRequest;`r`nimport com.dalai.llama.creator.dto.request.ShortUploadSessionRequest;`r`n")
$controller = $controller.Replace("import com.dalai.llama.creator.dto.response.ShortGenerationResponse;`r`n", "import com.dalai.llama.creator.dto.response.ShortGenerationResponse;`r`nimport com.dalai.llama.creator.dto.response.ShortUploadSessionResponse;`r`n")
$endpointAnchor = @'
    @GetMapping
    public ResponseEntity<List<ShortGenerationResponse>> listShortVideos(
'@
$endpointInsert = @'
    @PostMapping("/uploads")
    public ResponseEntity<ShortUploadSessionResponse> createChunkUpload(
            @RequestBody(required = false) ShortUploadSessionRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader,
            Authentication authentication
    ) {
        String userId = resolveUserId(authentication, userIdHeader);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(shortGenerationService.createChunkUpload(request, tenantId, userId));
    }

    @PostMapping(value = "/uploads/{uploadId}/chunks/{chunkIndex}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ShortUploadSessionResponse> uploadChunk(
            @PathVariable UUID uploadId,
            @PathVariable int chunkIndex,
            @RequestParam("chunk") MultipartFile chunk,
            @RequestParam(value = "totalChunks", required = false) Integer totalChunks,
            @RequestParam(value = "sizeBytes", required = false) Long sizeBytes,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader,
            Authentication authentication
    ) {
        String userId = resolveUserId(authentication, userIdHeader);
        return ResponseEntity.ok(shortGenerationService.uploadChunk(uploadId, chunkIndex, chunk, totalChunks, sizeBytes, tenantId, userId));
    }

    @PostMapping("/uploads/{uploadId}/complete")
    public ResponseEntity<ShortGenerationResponse> completeChunkUpload(
            @PathVariable UUID uploadId,
            @RequestBody(required = false) CompleteShortUploadRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader,
            Authentication authentication
    ) {
        String userId = resolveUserId(authentication, userIdHeader);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(shortGenerationService.completeChunkUpload(uploadId, request, tenantId, userId));
    }

'@ + $endpointAnchor
if (-not $controller.Contains($endpointAnchor)) { throw "controller endpoint anchor not found" }
$controller = $controller.Replace($endpointAnchor, $endpointInsert)
Set-Content -Path $controllerPath -Value $controller -NoNewline

Write-Host "Patched short chunk upload backend."
