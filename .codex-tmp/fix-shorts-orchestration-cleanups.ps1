$ErrorActionPreference = "Stop"
$file = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\CreatorShortGenerationService.java"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($file)
$duplicate = @"
                "visualCompositionPlanCount", visualStoryComposition.plans().size(),
                "visualCompositionPlanCount", visualStoryComposition.plans().size(),
"@
$single = @"
                "visualCompositionPlanCount", visualStoryComposition.plans().size(),
"@
$text = $text.Replace($duplicate, $single)

$needle = @"
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

"@
$insert = $needle + @"
    private List<String> listOfStrings(Object value) {
        if (value instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object item : list) {
                if (item != null && !String.valueOf(item).isBlank()) {
                    result.add(String.valueOf(item));
                }
            }
            return result;
        }
        return new ArrayList<>();
    }

"@
if (-not $text.Contains($needle)) {
    throw "Could not find addShortEdge helper insertion point"
}
$text = $text.Replace($needle, $insert)
[System.IO.File]::WriteAllText($file, $text, $utf8NoBom)
