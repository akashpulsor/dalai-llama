/** trend-intelligence-service reports -> the trend rows the planner shows: one per prediction, its
 * suggested tags as the tags and its 0..1 confidence as a 0..100 score. Nothing is made up. */
export function trendsFromReports(reports) {
  return (Array.isArray(reports) ? reports : []).flatMap((report) => (report?.predictions || []).map((prediction, index) => ({
    id: `${report.id}:${index}`,
    title: prediction.title,
    summary: prediction.summary,
    rationale: prediction.rationale,
    evidenceType: prediction.evidenceType,
    score: prediction.confidenceScore == null ? null : Math.round(Number(prediction.confidenceScore) * 100),
    hashtags: (prediction.suggestedTags || []).map((tag) => (String(tag).startsWith("#") ? tag : `#${tag}`)),
    category: report.industry || report.topic,
    sourceName: report.topic,
    reportId: report.id,
    createdAt: report.createdAt,
  })));
}
