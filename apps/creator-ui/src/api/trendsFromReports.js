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

/** The idea panel's "trend moments" are trend reports too, one per category, marked by industry so
 * the planner's trend list leaves them out. */
export const TREND_MOMENT_CATEGORIES = [
  { category: "history", label: "History" },
  { category: "politics", label: "Politics" },
  { category: "sports", label: "Sports" },
  { category: "entertainment", label: "Entertainment" },
  { category: "bollywood", label: "Bollywood" },
];

const TREND_MOMENT_PREFIX = "trend-moments:";

export const isTrendMomentReport = (report) => String(report?.industry || "").startsWith(TREND_MOMENT_PREFIX);

/** The request that generates one category's moments. */
export function trendMomentRequest({ category, label }) {
  return {
    topic: `${label} moments Indian audiences will talk about in the next 7 days -- short-form video ideas`,
    industry: `${TREND_MOMENT_PREFIX}${category}`,
  };
}

/** Trends are only generated when the creator asks (each run is charged to the wallet), so the
 * last run is shown until then -- flagged stale once it is older than this. */
export const TRENDS_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isTrendsStale(updatedAt, now = Date.now()) {
  const time = updatedAt ? new Date(updatedAt).getTime() : NaN;
  return !Number.isNaN(time) && now - time > TRENDS_STALE_AFTER_MS;
}

/** Newest report per category -> { updatedAt, categories: [{ category, label, ideas }] }, the shape
 * the idea panel and home page read. updatedAt is when moments were last generated (null if never);
 * categories with no report yet come back empty. */
export function trendMomentsFromReports(reports) {
  const moments = (Array.isArray(reports) ? reports : []).filter(isTrendMomentReport);
  return {
    updatedAt: moments.map((report) => String(report.createdAt || "")).sort().pop() || null,
    categories: TREND_MOMENT_CATEGORIES.map(({ category, label }) => {
      const newest = moments
        .filter((report) => report.industry === `${TREND_MOMENT_PREFIX}${category}`)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
      return {
        category,
        label,
        ideas: (newest?.predictions || []).map((prediction, index) => ({
          id: `${newest.id}:${index}`,
          title: prediction.title,
          prompt: prediction.summary || prediction.title,
          tags: prediction.suggestedTags || [],
        })),
      };
    }),
  };
}
