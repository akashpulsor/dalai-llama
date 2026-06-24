$ErrorActionPreference = "Stop"

$repo = "C:\Users\Akash\workspace\v5\dallai-llama-backend"
$serviceDir = Join-Path $repo "creator-service\src\main\java\com\dalai\llama\creator\service"
$tmp = "C:\Users\Akash\workspace\v4\dalai-llama\.codex-tmp"
$generationService = Join-Path $serviceDir "CreatorShortGenerationService.java"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

Copy-Item -LiteralPath (Join-Path $tmp "ShortVisualStoryCompositionService.java") -Destination (Join-Path $serviceDir "ShortVisualStoryCompositionService.java") -Force
Copy-Item -LiteralPath (Join-Path $tmp "ShortCandidateRankingService.java") -Destination (Join-Path $serviceDir "ShortCandidateRankingService.java") -Force
Copy-Item -LiteralPath (Join-Path $tmp "ShortPostRenderQaService.java") -Destination (Join-Path $serviceDir "ShortPostRenderQaService.java") -Force

$text = [System.IO.File]::ReadAllText($generationService)

function Replace-Exact {
    param([string]$Name, [string]$Old, [string]$New)
    if (-not $script:text.Contains($Old)) {
        throw "Could not find replacement target: $Name"
    }
    $script:text = $script:text.Replace($Old, $New)
}

Replace-Exact "pipeline visual composition" @"
            "INTERESTINGNESS_CRITIC",
            "STORY_BEAT_PLANNING",
            "COMPRESSION",
"@ @"
            "INTERESTINGNESS_CRITIC",
            "STORY_BEAT_PLANNING",
            "VISUAL_STORY_COMPOSITION",
            "COMPRESSION",
"@

Replace-Exact "pipeline post render qa" @"
            "RENDERING",
            "COMPLETED"
"@ @"
            "RENDERING",
            "POST_RENDER_QA",
            "COMPLETED"
"@

Replace-Exact "fields" @"
    private final ShortInterestingnessCriticService interestingnessCriticService;
    private final ShortStoryBeatPlanningService storyBeatPlanningService;
    private final ShortCompressionPlannerService compressionPlannerService;
    private final ShortHookGenerationService hookGenerationService;
    private final ShortCandidateCriticRepairService candidateCriticRepairService;
    private final ShortVisualEnhancementService visualEnhancementService;
    private final ShortVisualCriticService visualCriticService;
    private final ShortContinuityCriticService continuityCriticService;
    private final ShortGlobalCriticService globalCriticService;
    private final ShortRenderingService shortRenderingService;
"@ @"
    private final ShortInterestingnessCriticService interestingnessCriticService;
    private final ShortStoryBeatPlanningService storyBeatPlanningService;
    private final ShortVisualStoryCompositionService visualStoryCompositionService;
    private final ShortCompressionPlannerService compressionPlannerService;
    private final ShortHookGenerationService hookGenerationService;
    private final ShortCandidateCriticRepairService candidateCriticRepairService;
    private final ShortVisualEnhancementService visualEnhancementService;
    private final ShortVisualCriticService visualCriticService;
    private final ShortContinuityCriticService continuityCriticService;
    private final ShortCandidateRankingService candidateRankingService;
    private final ShortGlobalCriticService globalCriticService;
    private final ShortRenderingService shortRenderingService;
    private final ShortPostRenderQaService postRenderQaService;
"@

Replace-Exact "constructor params" @"
            ShortInterestingnessCriticService interestingnessCriticService,
            ShortStoryBeatPlanningService storyBeatPlanningService,
            ShortCompressionPlannerService compressionPlannerService,
            ShortHookGenerationService hookGenerationService,
            ShortCandidateCriticRepairService candidateCriticRepairService,
            ShortVisualEnhancementService visualEnhancementService,
            ShortVisualCriticService visualCriticService,
            ShortContinuityCriticService continuityCriticService,
            ShortGlobalCriticService globalCriticService,
            ShortRenderingService shortRenderingService,
"@ @"
            ShortInterestingnessCriticService interestingnessCriticService,
            ShortStoryBeatPlanningService storyBeatPlanningService,
            ShortVisualStoryCompositionService visualStoryCompositionService,
            ShortCompressionPlannerService compressionPlannerService,
            ShortHookGenerationService hookGenerationService,
            ShortCandidateCriticRepairService candidateCriticRepairService,
            ShortVisualEnhancementService visualEnhancementService,
            ShortVisualCriticService visualCriticService,
            ShortContinuityCriticService continuityCriticService,
            ShortCandidateRankingService candidateRankingService,
            ShortGlobalCriticService globalCriticService,
            ShortRenderingService shortRenderingService,
            ShortPostRenderQaService postRenderQaService,
"@

Replace-Exact "constructor assignment" @"
        this.interestingnessCriticService = interestingnessCriticService;
        this.storyBeatPlanningService = storyBeatPlanningService;
        this.compressionPlannerService = compressionPlannerService;
        this.hookGenerationService = hookGenerationService;
        this.candidateCriticRepairService = candidateCriticRepairService;
        this.visualEnhancementService = visualEnhancementService;
        this.visualCriticService = visualCriticService;
        this.continuityCriticService = continuityCriticService;
        this.globalCriticService = globalCriticService;
        this.shortRenderingService = shortRenderingService;
"@ @"
        this.interestingnessCriticService = interestingnessCriticService;
        this.storyBeatPlanningService = storyBeatPlanningService;
        this.visualStoryCompositionService = visualStoryCompositionService;
        this.compressionPlannerService = compressionPlannerService;
        this.hookGenerationService = hookGenerationService;
        this.candidateCriticRepairService = candidateCriticRepairService;
        this.visualEnhancementService = visualEnhancementService;
        this.visualCriticService = visualCriticService;
        this.continuityCriticService = continuityCriticService;
        this.candidateRankingService = candidateRankingService;
        this.globalCriticService = globalCriticService;
        this.shortRenderingService = shortRenderingService;
        this.postRenderQaService = postRenderQaService;
"@

Replace-Exact "ai trace filters" '        aiTrace = withoutTraceStage(aiTrace, "STORY_BEAT_PLANNING");' @"
        aiTrace = withoutTraceStage(aiTrace, "STORY_BEAT_PLANNING");
        aiTrace = withoutTraceStage(aiTrace, "VISUAL_STORY_COMPOSITION");
"@

Replace-Exact "story beat to compression" @"
        ShortCompressionPlannerService.CompressionPlanningResult compressionPlanning = compressionPlannerService.plan(video, transcript, graph, interestingnessScoring, interestingnessCritic);
        List<Map<String, Object>> compressionPlans = new ArrayList<>();
        compressionPlans.addAll(storyBeatPlanning.plans());
        compressionPlans.addAll(compressionPlanning.plans());
"@ @"
        ShortVisualStoryCompositionService.VisualStoryCompositionResult visualStoryComposition = visualStoryCompositionService.compose(
                video,
                videoDna,
                transcript,
                graph,
                sceneAnalysis.scenes(),
                sceneCritic.sceneCritic(),
                candidatePayloads,
                storyBeatPlanning.plans()
        );
        candidatePayloads = visualStoryComposition.candidates();
        trace.addAll(visualStoryComposition.trace());
        generationJobService.updateGenerationJobProgress(jobId, 72, "Visual story composition planned", Map.of(
                "activeStage", "VISUAL_STORY_COMPOSITION",
                "visualStoryComposition", visualStoryComposition.metadata(),
                "candidateCount", candidatePayloads.size(),
                "planCount", visualStoryComposition.plans().size(),
                "trace", trace
        ));

        ShortCompressionPlannerService.CompressionPlanningResult compressionPlanning = compressionPlannerService.plan(video, transcript, graph, interestingnessScoring, interestingnessCritic);
        List<Map<String, Object>> compressionPlans = new ArrayList<>();
        compressionPlans.addAll(visualStoryComposition.plans());
        compressionPlans.addAll(compressionPlanning.plans());
"@

Replace-Exact "compression progress counts" @"
                "planCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "compressionWorkerPlanCount", compressionPlanning.plans().size(),
"@ @"
                "planCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "visualCompositionPlanCount", visualStoryComposition.plans().size(),
                "compressionWorkerPlanCount", compressionPlanning.plans().size(),
"@

Replace-Exact "critic repair single pass" @"
        ShortCandidateCriticRepairService.CandidateCriticRepairResult criticRepair = candidateCriticRepairService.repair(
                video,
                videoDna,
                transcript,
                graph,
                candidatePayloads,
                compressionPlans
        );
        candidatePayloads = criticRepair.candidates();
        trace.addAll(withoutTraceStage(withoutTraceStage(criticRepair.trace(), "CONTINUITY_CRITIC"), "GLOBAL_CRITIC"));
        generationJobService.updateGenerationJobProgress(jobId, 82, "Short candidates compressed, critiqued, and repaired", Map.of(
                "videoDna", videoDna,
                "graph", graph,
                "compressionPlanCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "candidateCount", candidatePayloads.size(),
                "trace", trace
        ));
"@ @"
        ShortCandidateCriticRepairService.CandidateCriticRepairResult criticRepair = null;
        List<Map<String, Object>> criticRepairTrace = new ArrayList<>();
        int criticRepairAttempts = 0;
        for (int attempt = 1; attempt <= 3; attempt++) {
            criticRepairAttempts = attempt;
            criticRepair = candidateCriticRepairService.repair(
                    video,
                    videoDna,
                    transcript,
                    graph,
                    candidatePayloads,
                    compressionPlans
            );
            candidatePayloads = criticRepair.candidates();
            List<Map<String, Object>> attemptTrace = withRetryAttempt(
                    withoutTraceStage(withoutTraceStage(criticRepair.trace(), "CONTINUITY_CRITIC"), "GLOBAL_CRITIC"),
                    attempt
            );
            criticRepairTrace.addAll(attemptTrace);
            if (!needsAnotherRepairPass(candidatePayloads)) {
                break;
            }
        }
        trace.addAll(criticRepairTrace);
        generationJobService.updateGenerationJobProgress(jobId, 82, "Short candidates compressed, critiqued, and repaired", Map.of(
                "videoDna", videoDna,
                "graph", graph,
                "compressionPlanCount", compressionPlans.size(),
                "storyBeatPlanCount", storyBeatPlanning.plans().size(),
                "visualCompositionPlanCount", visualStoryComposition.plans().size(),
                "criticRepairAttempts", criticRepairAttempts,
                "candidateCount", candidatePayloads.size(),
                "trace", trace
        ));
"@

Replace-Exact "insert ranking before global" @"
        Map<String, Object> globalCriticEvidence = new LinkedHashMap<>();
"@ @"
        ShortCandidateRankingService.CandidateRankingResult candidateRanking = candidateRankingService.rank(
                video,
                videoDna,
                transcript,
                graph,
                candidatePayloads
        );
        candidatePayloads = candidateRanking.candidates();
        trace.addAll(candidateRanking.trace());
        generationJobService.updateGenerationJobProgress(jobId, 91, "Candidates ranked for final readiness", Map.of(
                "activeStage", "CANDIDATE_RANKING",
                "candidateRanking", candidateRanking.metadata(),
                "candidateCount", candidatePayloads.size(),
                "trace", trace
        ));

        Map<String, Object> globalCriticEvidence = new LinkedHashMap<>();
"@

Replace-Exact "global evidence" @"
        globalCriticEvidence.put("interestingnessCritic", interestingnessCritic.metadata());
        globalCriticEvidence.put("storyBeatPlanning", storyBeatPlanning.metadata());
        globalCriticEvidence.put("compressionPlanner", compressionPlanning.metadata());
"@ @"
        globalCriticEvidence.put("interestingnessCritic", interestingnessCritic.metadata());
        globalCriticEvidence.put("storyBeatPlanning", storyBeatPlanning.metadata());
        globalCriticEvidence.put("visualStoryComposition", visualStoryComposition.metadata());
        globalCriticEvidence.put("compressionPlanner", compressionPlanning.metadata());
        globalCriticEvidence.put("candidateRanking", candidateRanking.metadata());
"@

Replace-Exact "post render qa block" @"
        candidates = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());
        if (trace.size() < PIPELINE_STAGES.size()) {
            trace = defaultTrace(trace, videoDna);
        }
"@ @"
        candidates = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());
        ShortPostRenderQaService.PostRenderQaResult postRenderQa = postRenderQaService.audit(video, candidates);
        trace.addAll(postRenderQa.trace());
        generationJobService.updateGenerationJobProgress(jobId, 96, "Post-render QA complete", Map.of(
                "activeStage", "POST_RENDER_QA",
                "postRenderQa", postRenderQa.metadata(),
                "trace", trace
        ));
        candidates = candidateRepository.findByVideoIdOrderByRankIndexAsc(video.getId());
        graph = withShortCandidateGraphNodes(graph, candidates);
        if (trace.size() < PIPELINE_STAGES.size()) {
            trace = defaultTrace(trace, videoDna);
        }
"@

Replace-Exact "metadata additions" @"
        metadata.put("storyBeatPlanning", Map.of(
                "metadata", storyBeatPlanning.metadata(),
                "intentCount", storyBeatPlanning.intents().size(),
                "planCount", storyBeatPlanning.plans().size(),
                "intents", storyBeatPlanning.intents()
        ));
        metadata.put("realCompressionPlanner", Map.of(
"@ @"
        metadata.put("storyBeatPlanning", Map.of(
                "metadata", storyBeatPlanning.metadata(),
                "intentCount", storyBeatPlanning.intents().size(),
                "planCount", storyBeatPlanning.plans().size(),
                "intents", storyBeatPlanning.intents()
        ));
        metadata.put("visualStoryComposition", visualStoryComposition.metadata());
        metadata.put("realCompressionPlanner", Map.of(
"@

Replace-Exact "metadata visual composition count" '                "compressionWorkerPlanCount", compressionPlanning.plans().size(),' @"
                "visualCompositionPlanCount", visualStoryComposition.plans().size(),
                "compressionWorkerPlanCount", compressionPlanning.plans().size(),
"@

Replace-Exact "metadata critic repair attempts" '        metadata.put("criticRepairWorkers", criticRepair.metadata());' @"
        metadata.put("criticRepairWorkers", criticRepair.metadata());
        metadata.put("criticRepairAttempts", criticRepairAttempts);
"@

Replace-Exact "metadata ranking qa" @"
        metadata.put("continuityCritic", continuityCritic.metadata());
        metadata.put("globalCritic", globalCritic.metadata());
        metadata.put("rendering", rendering.metadata());
"@ @"
        metadata.put("continuityCritic", continuityCritic.metadata());
        metadata.put("candidateRanking", candidateRanking.metadata());
        metadata.put("globalCritic", globalCritic.metadata());
        metadata.put("rendering", rendering.metadata());
        metadata.put("postRenderQa", postRenderQa.metadata());
"@

Replace-Exact "prompt preprocessing list" @"
                - Independent interestingness critic validating score distribution, scorecards, evidence, ranking uniqueness, context safety, visual safety, and compression readiness.
                - Production hook generation runs after compression planning from exact EDL segments; planner hook output is advisory only.
                - Deterministic graph builder from full transcript plus scene data.
"@ @"
                - Independent interestingness critic validating score distribution, scorecards, evidence, ranking uniqueness, context safety, visual safety, and compression readiness.
                - Story beat planning creates source-grounded short intents, beat plans, hook promises, and exact graph-cut EDL seeds.
                - Visual story composition enforces narrator anchor, B-roll/support balance, face/speaker presence, and visual variety when source evidence exists.
                - Production hook generation runs after compression planning from exact EDL segments; planner hook output is advisory only.
                - Deterministic graph builder from full transcript plus scene data.
"@

Replace-Exact "prompt pipeline" @"
                INGESTION -> TRANSCRIPT -> TRANSCRIPT_CRITIC -> VIDEO_TYPE_CLASSIFICATION -> VIDEO_TYPE_CRITIC -> CONVERSATION_STRUCTURE -> SCENE_ANALYSIS -> SCENE_CRITIC -> VIDEO_GRAPH_BUILDER -> STORY_UNDERSTANDING -> STORY_CRITIC -> INTERESTINGNESS -> INTERESTINGNESS_CRITIC -> COMPRESSION -> COMPRESSION_CRITIC -> HOOK_GENERATION -> HOOK_CRITIC -> CAPTION_PLANNING -> CAPTION_CRITIC -> VISUAL_ENHANCEMENT -> VISUAL_CRITIC -> CONTINUITY_CRITIC -> CANDIDATE_RANKING -> GLOBAL_CRITIC -> TARGETED_REPAIR -> RENDERING -> COMPLETED.
"@ @"
                INGESTION -> TRANSCRIPT -> TRANSCRIPT_CRITIC -> VIDEO_TYPE_CLASSIFICATION -> VIDEO_TYPE_CRITIC -> CONVERSATION_STRUCTURE -> SCENE_ANALYSIS -> SCENE_CRITIC -> VIDEO_GRAPH_BUILDER -> STORY_UNDERSTANDING -> STORY_CRITIC -> INTERESTINGNESS -> INTERESTINGNESS_CRITIC -> STORY_BEAT_PLANNING -> VISUAL_STORY_COMPOSITION -> COMPRESSION -> COMPRESSION_CRITIC -> HOOK_GENERATION -> HOOK_CRITIC -> CAPTION_PLANNING -> CAPTION_CRITIC -> VISUAL_ENHANCEMENT -> VISUAL_CRITIC -> CONTINUITY_CRITIC -> CANDIDATE_RANKING -> GLOBAL_CRITIC -> TARGETED_REPAIR -> RENDERING -> POST_RENDER_QA -> COMPLETED.
"@

Replace-Exact "default trace optimistic status" @"
            String status = "RENDERING".equals(stage) ? "PENDING_REVIEW" : "COMPLETED";
            if ("COMPLETED".equals(stage)) {
                status = "READY_FOR_REVIEW";
            }
"@ @"
            String status = "NOT_RUN";
"@

[System.IO.File]::WriteAllText($generationService, $text, $utf8NoBom)
