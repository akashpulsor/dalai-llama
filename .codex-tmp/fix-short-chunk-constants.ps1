$ErrorActionPreference = "Stop"

$servicePath = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\CreatorShortGenerationService.java"
$storagePath = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\AssetStorageService.java"

$service = Get-Content -Raw -Path $servicePath
$old = "    private static final Duration SIGNED_URL_TTL = Duration.ofDays(7);"
$new = @'
    private static final Logger log = LoggerFactory.getLogger(CreatorShortGenerationService.class);
    private static final Duration SIGNED_URL_TTL = Duration.ofDays(7);
    private static final long DEFAULT_CHUNK_SIZE_BYTES = 8L * 1024L * 1024L;
    private static final long MAX_CHUNK_SIZE_BYTES = 64L * 1024L * 1024L;
    private static final int MAX_CHUNK_COUNT = 10000;
'@
if (-not $service.Contains("private static final Logger log")) {
  if (-not $service.Contains($old)) { throw "SIGNED_URL_TTL anchor not found" }
  $service = $service.Replace($old, $new)
}
Set-Content -Path $servicePath -Value $service -NoNewline

$storage = Get-Content -Raw -Path $storagePath
if (-not $storage.Contains("import software.amazon.awssdk.services.s3.model.HeadObjectRequest;")) {
  $anchor = "import software.amazon.awssdk.services.s3.model.HeadBucketRequest;"
  if (-not $storage.Contains($anchor)) { throw "HeadBucketRequest import anchor not found" }
  $storage = $storage.Replace($anchor, $anchor + "`nimport software.amazon.awssdk.services.s3.model.HeadObjectRequest;")
}
Set-Content -Path $storagePath -Value $storage -NoNewline

Write-Host "Fixed short chunk constants and S3 import."
