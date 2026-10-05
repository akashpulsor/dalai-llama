// Provider spend from llm-gateway's per-call cost rows, shaped for the ops page.

export const usd = (value) => `$${Number(value || 0).toFixed(Number(value || 0) < 1 ? 4 : 2)}`;

/** llm-gateway's per-call cost rows (project x provider x model) grouped into one entry per project,
 * newest activity first, with per-provider subtotals. Rows with no project fall into one
 * "Not tied to a project" group so their spend isn't silently missing from the totals. */
export function groupProviderCosts(rows = [], projects = []) {
  const names = new Map(projects.map((p) => [p.id, p.name]));
  const byProject = new Map();
  for (const row of rows) {
    const key = row.projectId || "none";
    if (!byProject.has(key)) {
      byProject.set(key, {
        projectId: row.projectId || null,
        name: row.projectId ? names.get(row.projectId) || `Project ${row.projectId.slice(0, 8)}` : "Not tied to a project",
        total: 0, calls: 0, noResult: 0, lastAt: null, providers: new Map(), models: [],
      });
    }
    const group = byProject.get(key);
    const cost = Number(row.costUsd || 0);
    group.total += cost;
    group.calls += row.calls;
    group.noResult += row.noResult;
    if (!group.lastAt || row.lastAt > group.lastAt) group.lastAt = row.lastAt;
    group.providers.set(row.providerId, (group.providers.get(row.providerId) || 0) + cost);
    group.models.push(row);
  }
  return [...byProject.values()]
    .map((group) => ({
      ...group,
      providers: [...group.providers.entries()].sort((a, b) => b[1] - a[1]),
      models: group.models.sort((a, b) => Number(b.costUsd) - Number(a.costUsd)),
    }))
    .sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
}
