$ErrorActionPreference = "Stop"

$repo = "C:\Users\Akash\workspace\v5\dallai-llama-backend"
$serviceDir = Join-Path $repo "creator-service\src\main\java\com\dalai\llama\creator\service"
$targetService = Join-Path $serviceDir "ShortStoryBeatPlanningService.java"
$sourceService = "C:\Users\Akash\workspace\v4\dalai-llama\.codex-tmp\ShortStoryBeatPlanningService.java"
$generationService = Join-Path $serviceDir "CreatorShortGenerationService.java"

Copy-Item -LiteralPath $sourceService -Destination $targetService -Force

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($generationService)

function Replace-Exact {
    param(
        [string]$Name,
        [string]$Old,
        [string]$New
    )
    if (-not $script:text.Contains($Old)) {
        throw "Could not find replacement target: $Name"
    }
    $script:text = $script:text.Replace($Old, $New)
}

Replace-Exact "pipeline stage" @"
            "INTERESTINGNESS",
            "INTERESTINGNESS_CRITIC",
            "COMPRESSION",
"@ @"
            "INTERESTINGNESS",
            "INTERESTINGNESS_CRITIC",
            "STORY_BEAT_PLANNING",
            "COMPRESSION",
"@

Replace-Exact "field injection" @"
    private final ShortInterestingnessScoringService interestingnessScoringService;
    private final ShortInterestingnessCriticService interestingnessCriticService;
    private final ShortCompressionPlannerService compressionPlannerService;
"@ @"
    private final ShortInterestingnessScoringService interestingnessScoringService;
    private final ShortInterestingnessCriticService interestingnessCriticService;
    private final ShortStoryBeatPlanningService storyBeatPlanningService;
    private final ShortCompressionPlannerService compressionPlannerService;
"@

Replace-Exact "constructor parameter" @"
            ShortInterestingnessScoringService interestingnessScoringService,
            ShortInterestingnessCriticService interestingnessCriticService,
            ShortCompressionPlannerService compressionPlannerService,
"@ @"
            ShortInterestingnessScoringService interestingnessScoringService,
            ShortInterestingnessCriticService interestingnessCriticService,
            ShortStoryBeatPlanningService storyBeatPlanningService,
            ShortCompressionPlannerService compressionPlannerService,
"@

Replace-Exact "constructor assignment" @"
        this.interestingnessScoringService = interestingnessScoringService;
        this.interestingnessCriticService = interestingnessCriticService;
        this.compressionPlannerService = compressionPlannerService;
"@ @"
        this.interestingnessScoringService = interestingnessScoringService;
        this.interestingnessCriticService = interestingnessCriticService;
        this.storyBeatPlanningService = storyBeatPlanningService;
        this.compressionPlannerService = compressionPlannerService;
"@

Replace-Exact "ai trace filter" @"
        aiTrace = withoutTraceStage(aiTrace, "INTERESTINGNESS_CRITIC");
"@ @"
        aiTrace = withoutTraceStage(aiTrace, "INTERESTINGNESS_CRITIC");
        aiTrace = withoutTraceStage(aiTrace, "STORY_BEAT_PLANNING");
"@

Replace-Exact "story beat planning block" @"
        List<Map<String, Object>> candidatePayloads = listOfMaps(aiOutput.get("candidates"));
        if (candidatePayloads.isEmpty()) {
            candidatePayloads = fallbackCandidates(video, transcript, graph);
        }

        ShortCompressionPlannerService.CompressionPlanningResult compressionPlanning = compressionPlannerService.plan(video, transcript, graph, interestingnessScoring, interestingnessCritic);
        trace.addAll(compressionPlanning.trace());
        generationJobService.updateGenerationJobProgress(jobId, 74, "Real compression plans generated", Map.of(
                "activeStage", "COMPRESSION",
                "planCount", compressionPlanning.plans().size(),
                "trace", trace
        ));
"@ @"
        List<Map<String, Object>> candidatePayloads = listOfMaps(aiOutput.get("candidates"));
        if (candidatePayloads.isEmpty()) {
            candidatePayloads = fallbackCandidates(video, transcript, graph);
        }

        ShortStoryBeatPlanningService.StoryBeatPlanningResult storyBeatPlanning = storyBeatPlanningService.plan(
                video,
                videoDna,
                transcript,
                graph,
                sceneAnalysis.scenes(),
                storyCritic.storyUnderstanding(),
                storyCritic.storyCritic(),
                interestingnessScoring,
                interestingnessCritic,
                candidatePayloads
        );
        candidatePayloads = storyBeatPlanning.candidates();
        trace.addAll(storyBeatPlanning.trace());
        generationJobService.updateGenerationJobProgress(jobId, 70, "Story beat intents planned", Map.of(
                "activeStage", "STORY_BEAT_PLANNING",
                "storyBeatPlanning", storyBeatPlanning.metadata(),
                "intentCount", storyBeatPlanning.intents().size(),
                "planCount", storyBeatPlanning.plans().size(),
                "candidateCount", candidatePayloads.size(),
                "trace", trace
        ));

        ShortCompressionPlannerService.CompressionPlanningResult compressionPlanning = compressionPlannerService.plan(video, transcript, graph, interestingnessScoring, interestingnessCritic);
        List<Map<String, Object>> compressionPlans = new ArrayList<>();
        compressionPlans.addAll(storyBeatPlanning.plans());
        compressionPlans.addAll(compressionPlanning.plans());
        trace.addAll(compressionPlanning.trace());
        generationJobService.updateGenerationJobProgress(jobId, 74, "Real compression plans generated", Map.of(
                "activeStage", "COMPRESSION",
                "planCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "compressionWorkerPlanCount", compressionPlanning.plans().size(),
                "trace", trace
        ));
"@

Replace-Exact "hook compression plans" @"
                graph,
                compressionPlanning.plans(),
                candidatePayloads,
"@ @"
                graph,
                compressionPlans,
                candidatePayloads,
"@

Replace-Exact "repair compression plans" @"
                graph,
                candidatePayloads,
                compressionPlanning.plans()
"@ @"
                graph,
                candidatePayloads,
                compressionPlans
"@

Replace-Exact "repair progress compression count" @"
                "graph", graph,
                "compressionPlanCount", compressionPlanning.plans().size(),
                "candidateCount", candidatePayloads.size(),
"@ @"
                "graph", graph,
                "compressionPlanCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "candidateCount", candidatePayloads.size(),
"@

Replace-Exact "global critic evidence" @"
        globalCriticEvidence.put("storyCritic", storyCritic.metadata());
        globalCriticEvidence.put("interestingnessCritic", interestingnessCritic.metadata());
        globalCriticEvidence.put("compressionPlanner", compressionPlanning.metadata());
"@ @"
        globalCriticEvidence.put("storyCritic", storyCritic.metadata());
        globalCriticEvidence.put("interestingnessCritic", interestingnessCritic.metadata());
        globalCriticEvidence.put("storyBeatPlanning", storyBeatPlanning.metadata());
        globalCriticEvidence.put("compressionPlanner", compressionPlanning.metadata());
"@

Replace-Exact "metadata story beat and compression" @"
        metadata.put("realGraphBuilder", graphBuild.metadata());
        metadata.put("realCompressionPlanner", Map.of(
                "metadata", compressionPlanning.metadata(),
                "planCount", compressionPlanning.plans().size(),
                "plans", compressionPlanning.plans()
        ));
"@ @"
        metadata.put("realGraphBuilder", graphBuild.metadata());
        metadata.put("storyBeatPlanning", Map.of(
                "metadata", storyBeatPlanning.metadata(),
                "intentCount", storyBeatPlanning.intents().size(),
                "planCount", storyBeatPlanning.plans().size(),
                "intents", storyBeatPlanning.intents()
        ));
        metadata.put("realCompressionPlanner", Map.of(
                "metadata", compressionPlanning.metadata(),
                "planCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "compressionWorkerPlanCount", compressionPlanning.plans().size(),
                "plans", compressionPlans
        ));
"@

[System.IO.File]::WriteAllText($generationService, $text, $utf8NoBom)
