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

$criticSource = Join-Path (Get-Location) ".codex-tmp\ShortContinuityCriticService.java"
$criticTarget = Join-Path $serviceDir "ShortContinuityCriticService.java"
Write-Utf8NoBom $criticTarget ([System.IO.File]::ReadAllText($criticSource))

$generationPath = Join-Path $serviceDir "CreatorShortGenerationService.java"
$generation = [System.IO.File]::ReadAllText($generationPath)

$generation = Replace-Once $generation `
    "    private final ShortVisualEnhancementService visualEnhancementService;`r`n    private final ShortVisualCriticService visualCriticService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "    private final ShortVisualEnhancementService visualEnhancementService;`r`n    private final ShortVisualCriticService visualCriticService;`r`n    private final ShortContinuityCriticService continuityCriticService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "continuity critic field"

$generation = Replace-Once $generation `
    "            ShortCandidateCriticRepairService candidateCriticRepairService,`r`n            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortVisualCriticService visualCriticService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "            ShortCandidateCriticRepairService candidateCriticRepairService,`r`n            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortVisualCriticService visualCriticService,`r`n            ShortContinuityCriticService continuityCriticService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "continuity critic constructor param"

$generation = Replace-Once $generation `
    "        this.visualEnhancementService = visualEnhancementService;`r`n        this.visualCriticService = visualCriticService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "        this.visualEnhancementService = visualEnhancementService;`r`n        this.visualCriticService = visualCriticService;`r`n        this.continuityCriticService = continuityCriticService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "continuity critic assignment"

$generation = Replace-Once $generation `
    "        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_ENHANCEMENT`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_CRITIC`");" `
    "        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_ENHANCEMENT`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_CRITIC`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"CONTINUITY_CRITIC`");" `
    "continuity ai trace filter"

$generation = Replace-Once $generation `
    "        candidatePayloads = criticRepair.candidates();`r`n        trace.addAll(criticRepair.trace());" `
    "        candidatePayloads = criticRepair.candidates();`r`n        trace.addAll(withoutTraceStage(criticRepair.trace(), `"CONTINUITY_CRITIC`"));" `
    "old continuity trace filter"

$generation = Replace-Once $generation `
    "        generationJobService.updateGenerationJobProgress(jobId, 88, `"Visual critic verified render plans`", Map.of(`r`n                `"activeStage`", `"VISUAL_CRITIC`",`r`n                `"visualCritic`", visualCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "        generationJobService.updateGenerationJobProgress(jobId, 88, `"Visual critic verified render plans`", Map.of(`r`n                `"activeStage`", `"VISUAL_CRITIC`",`r`n                `"visualCritic`", visualCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        ShortContinuityCriticService.ContinuityCriticResult continuityCritic = continuityCriticService.critique(`r`n                video,`r`n                videoDna,`r`n                transcript,`r`n                graph,`r`n                candidatePayloads,`r`n                sceneAnalysis.scenes(),`r`n                storyCritic.storyCritic(),`r`n                sceneCritic.sceneCritic()`r`n        );`r`n        candidatePayloads = continuityCritic.candidates();`r`n        trace.addAll(continuityCritic.trace());`r`n        generationJobService.updateGenerationJobProgress(jobId, 90, `"Continuity critic verified final edit continuity`", Map.of(`r`n                `"activeStage`", `"CONTINUITY_CRITIC`",`r`n                `"continuityCritic`", continuityCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "continuity critic stage"

$generation = Replace-Once $generation `
    "        metadata.put(`"visualEnhancement`", visualEnhancement.metadata());`r`n        metadata.put(`"visualCritic`", visualCritic.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "        metadata.put(`"visualEnhancement`", visualEnhancement.metadata());`r`n        metadata.put(`"visualCritic`", visualCritic.metadata());`r`n        metadata.put(`"continuityCritic`", continuityCritic.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "continuity critic metadata"

Write-Utf8NoBom $generationPath $generation

Write-Host "Continuity critic backend patch applied."
