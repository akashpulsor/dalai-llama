$ErrorActionPreference = "Stop"

$servicePath = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\CreatorShortGenerationService.java"
$storagePath = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\AssetStorageService.java"
$controllerPath = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\controller\CreatorShortGenerationController.java"

function Add-After($text, $anchor, $insert) {
  if ($text.Contains($insert.Trim())) { return $text }
  if (-not $text.Contains($anchor)) { throw "anchor not found: $anchor" }
  return $text.Replace($anchor, $anchor + $insert)
}

$storage = Get-Content -Raw -Path $storagePath
$storage = Add-After $storage "import software.amazon.awssdk.core.sync.RequestBody;`n" "import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;`n"
$storage = Add-After $storage "import java.nio.file.Path;`n" "import java.io.IOException;`nimport java.io.OutputStream;`nimport java.nio.file.Files;`n"
Set-Content -Path $storagePath -Value $storage -NoNewline

$service = Get-Content -Raw -Path $servicePath
$service = Add-After $service "import com.dalai.llama.creator.dto.request.GenerateShortsRequest;`n" "import com.dalai.llama.creator.dto.request.CompleteShortUploadRequest;`nimport com.dalai.llama.creator.dto.request.ShortUploadSessionRequest;`n"
$service = Add-After $service "import com.dalai.llama.creator.dto.response.ShortGenerationResponse;`n" "import com.dalai.llama.creator.dto.response.ShortUploadSessionResponse;`n"
$service = Add-After $service "import com.fasterxml.jackson.databind.ObjectMapper;`n" "import org.slf4j.Logger;`nimport org.slf4j.LoggerFactory;`n"
$service = Add-After $service "import java.io.IOException;`n" "import java.io.OutputStream;`n"
Set-Content -Path $servicePath -Value $service -NoNewline

$controller = Get-Content -Raw -Path $controllerPath
$controller = Add-After $controller "import com.dalai.llama.creator.dto.request.GenerateShortsRequest;`n" "import com.dalai.llama.creator.dto.request.CompleteShortUploadRequest;`nimport com.dalai.llama.creator.dto.request.ShortUploadSessionRequest;`n"
$controller = Add-After $controller "import com.dalai.llama.creator.dto.response.ShortGenerationResponse;`n" "import com.dalai.llama.creator.dto.response.ShortUploadSessionResponse;`n"
Set-Content -Path $controllerPath -Value $controller -NoNewline

Write-Host "Fixed short chunk upload imports."
