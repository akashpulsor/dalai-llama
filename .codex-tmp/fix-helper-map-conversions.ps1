$ErrorActionPreference = "Stop"
$file = "C:\Users\Akash\workspace\v5\dallai-llama-backend\creator-service\src\main\java\com\dalai\llama\creator\service\CreatorShortGenerationService.java"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($file)
$text = $text.Replace('Map<String, Object> metadata = mutableMap(copy.get("metadata"));', 'Map<String, Object> metadata = mapValue(copy.get("metadata"));')
$text = $text.Replace('Map<String, Object> metadata = mutableMap(candidate.get("metadata"));', 'Map<String, Object> metadata = mapValue(candidate.get("metadata"));')
$text = $text.Replace('Map<String, Object> critics = mutableMap(metadata.get("critics"));', 'Map<String, Object> critics = mapValue(metadata.get("critics"));')
$text = $text.Replace('Map<String, Object> critic = mutableMap(value);', 'Map<String, Object> critic = mapValue(value);')
$text = $text.Replace('mutableMap(metadata.get("compressionPlanMetadata")).get("storyIntent")', 'mapValue(metadata.get("compressionPlanMetadata")).get("storyIntent")')
$text = $text.Replace('mutableMap(metadata.get("compressionPlanMetadata")).get("storyBeatPlan")', 'mapValue(metadata.get("compressionPlanMetadata")).get("storyBeatPlan")')
$text = $text.Replace('Map<String, Object> hookPlan = mutableMap(metadata.get("hookPlan"));', 'Map<String, Object> hookPlan = mapValue(metadata.get("hookPlan"));')
$text = $text.Replace('Map<String, Object> map = mutableMap(value);', 'Map<String, Object> map = mapValue(value);')
[System.IO.File]::WriteAllText($file, $text, $utf8NoBom)
