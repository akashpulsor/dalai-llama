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

$criticSource = Join-Path (Get-Location) ".codex-tmp\ShortVisualCriticService.java"
$criticTarget = Join-Path $serviceDir "ShortVisualCriticService.java"
Write-Utf8NoBom $criticTarget ([System.IO.File]::ReadAllText($criticSource))

$generationPath = Join-Path $serviceDir "CreatorShortGenerationService.java"
$generation = [System.IO.File]::ReadAllText($generationPath)

$generation = Replace-Once $generation `
    "    private final ShortCandidateCriticRepairService candidateCriticRepairService;`r`n    private final ShortVisualEnhancementService visualEnhancementService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "    private final ShortCandidateCriticRepairService candidateCriticRepairService;`r`n    private final ShortVisualEnhancementService visualEnhancementService;`r`n    private final ShortVisualCriticService visualCriticService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "generation visual critic field"

$generation = Replace-Once $generation `
    "            ShortHookGenerationService hookGenerationService,`r`n            ShortCandidateCriticRepairService candidateCriticRepairService,`r`n            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "            ShortHookGenerationService hookGenerationService,`r`n            ShortCandidateCriticRepairService candidateCriticRepairService,`r`n            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortVisualCriticService visualCriticService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "generation visual critic constructor param"

$generation = Replace-Once $generation `
    "        this.candidateCriticRepairService = candidateCriticRepairService;`r`n        this.visualEnhancementService = visualEnhancementService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "        this.candidateCriticRepairService = candidateCriticRepairService;`r`n        this.visualEnhancementService = visualEnhancementService;`r`n        this.visualCriticService = visualCriticService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "generation visual critic assignment"

$generation = Replace-Once $generation `
    "        aiTrace = withoutTraceStage(aiTrace, `"HOOK_GENERATION`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_ENHANCEMENT`");" `
    "        aiTrace = withoutTraceStage(aiTrace, `"HOOK_GENERATION`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_ENHANCEMENT`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_CRITIC`");" `
    "generation ai visual critic filter"

$generation = Replace-Once $generation `
    "        generationJobService.updateGenerationJobProgress(jobId, 86, `"Visual enhancement plans generated`", Map.of(`r`n                `"activeStage`", `"VISUAL_ENHANCEMENT`",`r`n                `"visualEnhancement`", visualEnhancement.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "        generationJobService.updateGenerationJobProgress(jobId, 86, `"Visual enhancement plans generated`", Map.of(`r`n                `"activeStage`", `"VISUAL_ENHANCEMENT`",`r`n                `"visualEnhancement`", visualEnhancement.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        ShortVisualCriticService.VisualCriticResult visualCritic = visualCriticService.critique(`r`n                video,`r`n                videoDna,`r`n                candidatePayloads,`r`n                sceneAnalysis.scenes(),`r`n                sceneAnalysis.frames(),`r`n                sceneCritic.sceneCritic()`r`n        );`r`n        candidatePayloads = visualCritic.candidates();`r`n        trace.addAll(visualCritic.trace());`r`n        generationJobService.updateGenerationJobProgress(jobId, 88, `"Visual critic verified render plans`", Map.of(`r`n                `"activeStage`", `"VISUAL_CRITIC`",`r`n                `"visualCritic`", visualCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "generation visual critic stage"

$generation = Replace-Once $generation `
    "        metadata.put(`"criticRepairWorkers`", criticRepair.metadata());`r`n        metadata.put(`"visualEnhancement`", visualEnhancement.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "        metadata.put(`"criticRepairWorkers`", criticRepair.metadata());`r`n        metadata.put(`"visualEnhancement`", visualEnhancement.metadata());`r`n        metadata.put(`"visualCritic`", visualCritic.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "generation visual critic metadata"

Write-Utf8NoBom $generationPath $generation

Write-Host "Visual critic backend patch applied."
