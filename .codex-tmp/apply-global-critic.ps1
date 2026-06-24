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

$globalSource = Join-Path (Get-Location) ".codex-tmp\ShortGlobalCriticService.java"
$globalTarget = Join-Path $serviceDir "ShortGlobalCriticService.java"
Write-Utf8NoBom $globalTarget ([System.IO.File]::ReadAllText($globalSource))

$generationPath = Join-Path $serviceDir "CreatorShortGenerationService.java"
$generation = [System.IO.File]::ReadAllText($generationPath)

$generation = Replace-Once $generation `
    "    private final ShortVisualCriticService visualCriticService;`r`n    private final ShortContinuityCriticService continuityCriticService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "    private final ShortVisualCriticService visualCriticService;`r`n    private final ShortContinuityCriticService continuityCriticService;`r`n    private final ShortGlobalCriticService globalCriticService;`r`n    private final ShortRenderingService shortRenderingService;" `
    "global critic field"

$generation = Replace-Once $generation `
    "            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortVisualCriticService visualCriticService,`r`n            ShortContinuityCriticService continuityCriticService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "            ShortVisualEnhancementService visualEnhancementService,`r`n            ShortVisualCriticService visualCriticService,`r`n            ShortContinuityCriticService continuityCriticService,`r`n            ShortGlobalCriticService globalCriticService,`r`n            ShortRenderingService shortRenderingService,`r`n            ObjectMapper objectMapper" `
    "global critic constructor param"

$generation = Replace-Once $generation `
    "        this.visualCriticService = visualCriticService;`r`n        this.continuityCriticService = continuityCriticService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "        this.visualCriticService = visualCriticService;`r`n        this.continuityCriticService = continuityCriticService;`r`n        this.globalCriticService = globalCriticService;`r`n        this.shortRenderingService = shortRenderingService;" `
    "global critic assignment"

$generation = Replace-Once $generation `
    "        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_CRITIC`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"CONTINUITY_CRITIC`");" `
    "        aiTrace = withoutTraceStage(aiTrace, `"VISUAL_CRITIC`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"CONTINUITY_CRITIC`");`r`n        aiTrace = withoutTraceStage(aiTrace, `"GLOBAL_CRITIC`");" `
    "global ai trace filter"

$generation = Replace-Once $generation `
    "        candidatePayloads = criticRepair.candidates();`r`n        trace.addAll(withoutTraceStage(criticRepair.trace(), `"CONTINUITY_CRITIC`"));" `
    "        candidatePayloads = criticRepair.candidates();`r`n        trace.addAll(withoutTraceStage(withoutTraceStage(criticRepair.trace(), `"CONTINUITY_CRITIC`"), `"GLOBAL_CRITIC`"));" `
    "old global trace filter"

$generation = Replace-Once $generation `
    "        generationJobService.updateGenerationJobProgress(jobId, 90, `"Continuity critic verified final edit continuity`", Map.of(`r`n                `"activeStage`", `"CONTINUITY_CRITIC`",`r`n                `"continuityCritic`", continuityCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "        generationJobService.updateGenerationJobProgress(jobId, 90, `"Continuity critic verified final edit continuity`", Map.of(`r`n                `"activeStage`", `"CONTINUITY_CRITIC`",`r`n                `"continuityCritic`", continuityCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        Map<String, Object> globalCriticEvidence = new LinkedHashMap<>();`r`n        globalCriticEvidence.put(`"transcriptCritic`", transcriptCritic.metadata());`r`n        globalCriticEvidence.put(`"videoTypeCritic`", videoTypeCritic.metadata());`r`n        globalCriticEvidence.put(`"storyCritic`", storyCritic.metadata());`r`n        globalCriticEvidence.put(`"interestingnessCritic`", interestingnessCritic.metadata());`r`n        globalCriticEvidence.put(`"compressionPlanner`", compressionPlanning.metadata());`r`n        globalCriticEvidence.put(`"hookGeneration`", hookGeneration.metadata());`r`n        globalCriticEvidence.put(`"criticRepair`", criticRepair.metadata());`r`n        globalCriticEvidence.put(`"visualEnhancement`", visualEnhancement.metadata());`r`n        globalCriticEvidence.put(`"visualCritic`", visualCritic.metadata());`r`n        globalCriticEvidence.put(`"continuityCritic`", continuityCritic.metadata());`r`n        ShortGlobalCriticService.GlobalCriticResult globalCritic = globalCriticService.critique(`r`n                video,`r`n                videoDna,`r`n                transcript,`r`n                graph,`r`n                candidatePayloads,`r`n                globalCriticEvidence`r`n        );`r`n        candidatePayloads = globalCritic.candidates();`r`n        trace.addAll(globalCritic.trace());`r`n        generationJobService.updateGenerationJobProgress(jobId, 92, `"Global critic verified production readiness`", Map.of(`r`n                `"activeStage`", `"GLOBAL_CRITIC`",`r`n                `"globalCritic`", globalCritic.metadata(),`r`n                `"candidateCount`", candidatePayloads.size(),`r`n                `"trace`", trace`r`n        ));`r`n`r`n        List<CreatorShortCandidate> existing = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());" `
    "global critic stage"

$generation = Replace-Once $generation `
    "        metadata.put(`"visualCritic`", visualCritic.metadata());`r`n        metadata.put(`"continuityCritic`", continuityCritic.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "        metadata.put(`"visualCritic`", visualCritic.metadata());`r`n        metadata.put(`"continuityCritic`", continuityCritic.metadata());`r`n        metadata.put(`"globalCritic`", globalCritic.metadata());`r`n        metadata.put(`"rendering`", rendering.metadata());" `
    "global critic metadata"

Write-Utf8NoBom $generationPath $generation

$rendererPath = Join-Path $serviceDir "ShortRenderingService.java"
$renderer = [System.IO.File]::ReadAllText($rendererPath)

$renderer = Replace-Once $renderer `
    "            for (CreatorShortCandidate candidate : candidates) {`r`n                try {`r`n                    RenderedCandidate rendered = renderCandidate(video, sourceAsset, candidate, sourcePath, sourceHasAudio, workspace);" `
    "            for (CreatorShortCandidate candidate : candidates) {`r`n                try {`r`n                    if (renderBlockedByGlobalCritic(candidate)) {`r`n                        Map<String, Object> failure = globalCriticBlock(candidate);`r`n                        failures.add(failure);`r`n                        markRenderBlocked(candidate, failure);`r`n                        continue;`r`n                    }`r`n                    RenderedCandidate rendered = renderCandidate(video, sourceAsset, candidate, sourcePath, sourceHasAudio, workspace);" `
    "renderer global block check"

$rendererHelpers = @'
    private boolean renderBlockedByGlobalCritic(CreatorShortCandidate candidate) {
        Map<String, Object> renderManifest = mapValue(candidate == null ? null : candidate.getRenderManifest());
        if (Boolean.TRUE.equals(renderManifest.get("renderBlocked"))) {
            return true;
        }
        String renderStatus = stringValue(renderManifest.get("renderStatus"), "");
        String globalStatus = stringValue(renderManifest.get("globalCriticStatus"), "");
        return "BLOCKED_BY_GLOBAL_CRITIC".equalsIgnoreCase(renderStatus) || "FAIL".equalsIgnoreCase(globalStatus);
    }

    private Map<String, Object> globalCriticBlock(CreatorShortCandidate candidate) {
        Map<String, Object> renderManifest = mapValue(candidate == null ? null : candidate.getRenderManifest());
        Map<String, Object> globalCritic = mapValue(renderManifest.get("globalCritic"));
        Map<String, Object> failure = new LinkedHashMap<>();
        failure.put("candidateId", candidate == null || candidate.getId() == null ? null : candidate.getId().toString());
        failure.put("rankIndex", candidate == null ? null : candidate.getRankIndex());
        failure.put("message", stringValue(globalCritic.get("summary"), "Blocked by GLOBAL_CRITIC before rendering."));
        failure.put("globalCriticStatus", stringValue(renderManifest.get("globalCriticStatus"), "FAIL"));
        failure.put("globalReadiness", stringValue(renderManifest.get("globalReadiness"), "BLOCKED_FOR_REVIEW"));
        failure.put("globalCritic", globalCritic);
        return failure;
    }

    private void markRenderBlocked(CreatorShortCandidate candidate, Map<String, Object> failure) {
        Map<String, Object> renderManifest = mapValue(candidate.getRenderManifest());
        renderManifest.put("renderStatus", "BLOCKED_BY_GLOBAL_CRITIC");
        renderManifest.put("renderFailure", failure);
        renderManifest.put("renderedAt", OffsetDateTime.now().toString());
        Map<String, Object> metadata = mapValue(candidate.getMetadata());
        metadata.put("renderingStatus", "BLOCKED_BY_GLOBAL_CRITIC");
        metadata.put("renderFailure", failure);
        candidate.setStatus("RENDER_BLOCKED");
        candidate.setRenderManifest(renderManifest);
        candidate.setMetadata(metadata);
        candidateRepository.save(candidate);
    }

'@

$renderer = Replace-Once $renderer `
    "    private void markRenderFailed(CreatorShortCandidate candidate, Map<String, Object> failure) {" `
    ($rendererHelpers + "    private void markRenderFailed(CreatorShortCandidate candidate, Map<String, Object> failure) {") `
    "renderer global block helpers"

Write-Utf8NoBom $rendererPath $renderer

Write-Host "Global critic backend patch applied."
