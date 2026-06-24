$ErrorActionPreference = "Stop"
$generationService = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\CreatorShortGenerationService.java"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($generationService)
$needle = "    private List<Map<String, Object>> defaultTrace(List<Map<String, Object>> existingTrace, Map<String, Object> videoDna) {"
if (-not $text.Contains($needle)) {
    throw "Could not find defaultTrace insertion point"
}
$helpers = @'
    private List<Map<String, Object>> withRetryAttempt(List<Map<String, Object>> rows, int attempt) {
        List<Map<String, Object>> updated = new ArrayList<>();
        for (Map<String, Object> row : rows == null ? List.<Map<String, Object>>of() : rows) {
            Map<String, Object> copy = new LinkedHashMap<>(row);
            Map<String, Object> metadata = mutableMap(copy.get("metadata"));
            metadata.put("criticRetryAttempt", attempt);
            copy.put("criticRetryAttempt", attempt);
            copy.put("metadata", metadata);
            updated.add(copy);
        }
        return updated;
    }

    private boolean needsAnotherRepairPass(List<Map<String, Object>> candidates) {
        for (Map<String, Object> candidate : candidates == null ? List.<Map<String, Object>>of() : candidates) {
            Map<String, Object> metadata = mutableMap(candidate.get("metadata"));
            Map<String, Object> critics = mutableMap(metadata.get("critics"));
            if (criticFailed(critics.get("compressionCritic"))
                    || criticFailed(critics.get("hookCritic"))
                    || criticFailed(critics.get("captionCritic"))
                    || criticFailed(critics.get("globalCritic"))) {
                return true;
            }
        }
        return false;
    }

    private boolean criticFailed(Object value) {
        Map<String, Object> critic = mutableMap(value);
        if (critic.isEmpty()) {
            return false;
        }
        String status = defaultString(critic.get("status"), "");
        return "FAIL".equalsIgnoreCase(status) || Boolean.FALSE.equals(critic.get("passed"));
    }

    private Map<String, Object> withShortCandidateGraphNodes(Map<String, Object> graph, List<CreatorShortCandidate> candidates) {
        Map<String, Object> result = mutableMap(graph);
        List<Map<String, Object>> nodes = listOfMaps(result.get("nodes"));
        List<Map<String, Object>> edges = listOfMaps(result.get("edges"));
        nodes.removeIf(node -> "SHORT_CANDIDATE".equalsIgnoreCase(defaultString(node.get("type"), "")));
        edges.removeIf(edge -> "SHORT_CANDIDATE_GRAPH_EDGE".equalsIgnoreCase(defaultString(edge.get("source"), "")));

        List<Map<String, Object>> shortNodes = new ArrayList<>();
        java.util.Set<String> edgeKeys = new java.util.HashSet<>();
        for (CreatorShortCandidate candidate : candidates == null ? List.<CreatorShortCandidate>of() : candidates) {
            if (candidate == null || candidate.getId() == null) {
                continue;
            }
            String shortNodeId = "short-" + candidate.getId();
            Map<String, Object> metadata = mutableMap(candidate.getMetadata());
            Map<String, Object> edl = mutableMap(candidate.getEditDecisionList());
            Map<String, Object> storyIntent = firstNonEmptyMap(metadata.get("storyIntent"), mutableMap(metadata.get("compressionPlanMetadata")).get("storyIntent"));
            Map<String, Object> storyBeatPlan = firstNonEmptyMap(metadata.get("storyBeatPlan"), mutableMap(metadata.get("compressionPlanMetadata")).get("storyBeatPlan"));
            Map<String, Object> hookPlan = mutableMap(metadata.get("hookPlan"));

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", shortNodeId);
            node.put("label", truncate(defaultString(candidate.getTitle(), "Short " + candidate.getRankIndex()), 80));
            node.put("type", "SHORT_CANDIDATE");
            node.put("rankIndex", candidate.getRankIndex());
            node.put("candidateId", candidate.getId().toString());
            node.put("assetId", candidate.getAssetId() == null ? null : candidate.getAssetId().toString());
            node.put("status", candidate.getStatus());
            node.put("reviewStatus", candidate.getReviewStatus());
            node.put("score", candidate.getScore());
            node.put("hookType", candidate.getHookType());
            node.put("storyIntent", storyIntent);
            node.put("storyBeatPlan", storyBeatPlan);
            node.put("hookPlan", hookPlan);
            node.put("sourceNodeIds", sourceNodeIds(edl));
            node.put("sceneIds", sceneIds(edl));
            node.put("ui", Map.of(
                    "blink", true,
                    "editable", true,
                    "modal", "SHORT_STORY_GRAPH_NODE_EDITOR",
                    "contextLocked", true,
                    "editableFields", List.of("intent", "beats", "hook")
            ));
            node.put("humanLoopPolicy", Map.of(
                    "mustStayInsideOriginalStory", true,
                    "allowedSourceNodeIds", sourceNodeIds(edl),
                    "allowedSceneIds", sceneIds(edl),
                    "maxIntentChars", 220,
                    "maxHookChars", 120
            ));
            nodes.add(node);
            shortNodes.add(node);

            for (String nodeId : sourceNodeIds(edl)) {
                addShortEdge(edges, edgeKeys, nodeId, shortNodeId, "INCLUDED_IN_SHORT", "Transcript node included in generated short.");
            }
            for (String sceneId : sceneIds(edl)) {
                addShortEdge(edges, edgeKeys, sceneId, shortNodeId, "SCENE_USED_IN_SHORT", "Visual scene used by generated short.");
            }
        }
        result.put("nodes", nodes);
        result.put("edges", edges);
        result.put("shortCandidateGraph", Map.of(
                "source", "creator_short_generation_service",
                "nodeCount", shortNodes.size(),
                "humanInLoopEnabled", true,
                "contextLocked", true,
                "updatedAt", OffsetDateTime.now().toString()
        ));
        return result;
    }

    private Map<String, Object> firstNonEmptyMap(Object... values) {
        for (Object value : values == null ? new Object[0] : values) {
            Map<String, Object> map = mutableMap(value);
            if (!map.isEmpty()) {
                return map;
            }
        }
        return new LinkedHashMap<>();
    }

    private List<String> sourceNodeIds(Map<String, Object> edl) {
        java.util.LinkedHashSet<String> ids = new java.util.LinkedHashSet<>();
        for (Map<String, Object> segment : listOfMaps(edl.get("segments"))) {
            String nodeId = defaultString(segment.get("nodeId"), "");
            if (!nodeId.isBlank()) {
                ids.add(nodeId);
            }
        }
        return new ArrayList<>(ids);
    }

    private List<String> sceneIds(Map<String, Object> edl) {
        java.util.LinkedHashSet<String> ids = new java.util.LinkedHashSet<>();
        ids.addAll(listOfStrings(edl.get("sceneIds")));
        for (Map<String, Object> segment : listOfMaps(edl.get("segments"))) {
            String sceneId = defaultString(segment.get("sceneId"), "");
            if (!sceneId.isBlank()) {
                ids.add(sceneId);
            }
        }
        ids.remove("");
        return new ArrayList<>(ids);
    }

    private void addShortEdge(List<Map<String, Object>> edges, java.util.Set<String> edgeKeys, String from, String to, String type, String reason) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            return;
        }
        String key = from + "->" + to + ":" + type;
        if (!edgeKeys.add(key)) {
            return;
        }
        Map<String, Object> edge = new LinkedHashMap<>();
        edge.put("from", from);
        edge.put("to", to);
        edge.put("type", type);
        edge.put("source", "SHORT_CANDIDATE_GRAPH_EDGE");
        edge.put("reason", reason);
        edges.add(edge);
    }

'@
$text = $text.Replace($needle, $helpers + $needle)
[System.IO.File]::WriteAllText($generationService, $text, $utf8NoBom)
