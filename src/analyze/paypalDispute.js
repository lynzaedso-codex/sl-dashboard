import { asText, asDate, monthKey, monthLabel, groupBy, topN } from "../utils.js";
import { NO_RESPONSE_KEYWORDS } from "../config.js";

function normalizeResult(caseStatusRaw) {
  const s = caseStatusRaw.toLowerCase();
  if (/win|won|seller.?s favor|resolved in (your|our)/.test(s)) return "Win";
  if (/lost|lose|buyer.?s favor/.test(s)) return "Lost";
  if (/partial|split|mixed/.test(s)) return "Partial";
  if (/review|open|pending|awaiting|processing/.test(s)) return "Pending";
  if (!s) return "Pending";
  return "Other";
}

export function analyzePaypalDispute(rows) {
  const now = Date.now();

  const normalized = rows.map((r) => {
    const dateDispute = asDate(r["Date Dispute"]);
    const dueDate = asDate(r["Due date"]);
    const caseStatus = asText(r["Case Status"]);
    const update = asText(r["Update"]);
    const result = normalizeResult(caseStatus);
    return {
      caseId: asText(r["Case ID"]),
      caseReason: asText(r["Case Reason"]) || "Unknown",
      caseType: asText(r["Case Type"]) || "Unknown",
      caseStatus: caseStatus || "Unknown",
      result,
      channel: asText(r["Channel"]) || "Unknown",
      store: asText(r["Store"]) || "Unknown",
      supplier: asText(r["Supplier"]) || "Unknown",
      shippingStatus: asText(r["Status"]) || "Unknown",
      dateDispute,
      dueDate,
      monthKey: dateDispute ? monthKey(dateDispute) : "Unknown",
      update,
      isOverdue: Boolean(dueDate) && dueDate.getTime() < now && result === "Pending",
      noResponse: NO_RESPONSE_KEYWORDS.some((kw) => update.toLowerCase().includes(kw)),
    };
  });

  const total = normalized.length;
  const wins = normalized.filter((r) => r.result === "Win").length;
  const losses = normalized.filter((r) => r.result === "Lost").length;
  const decided = wins + losses;
  const backlog = normalized.filter((r) => r.isOverdue).length;
  const noResponseCount = normalized.filter((r) => r.noResponse).length;

  const monthlyGroups = groupBy(normalized, (r) => r.monthKey);
  for (const key of Object.keys(monthlyGroups)) {
    const rowsInMonth = normalized.filter((r) => r.monthKey === key);
    monthlyGroups[key].win = rowsInMonth.filter((r) => r.result === "Win").length;
    monthlyGroups[key].lost = rowsInMonth.filter((r) => r.result === "Lost").length;
  }
  const monthly = Object.values(monthlyGroups)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((g) => ({ ...g, label: monthLabel(g.key) }));

  const byCaseReason = topN(groupBy(normalized, (r) => r.caseReason), 8);
  const winRateByReason = Object.values(groupBy(normalized, (r) => r.caseReason)).map((g) => {
    const rowsForReason = normalized.filter((r) => r.caseReason === g.key);
    const w = rowsForReason.filter((r) => r.result === "Win").length;
    const l = rowsForReason.filter((r) => r.result === "Lost").length;
    const d = w + l;
    return { key: g.key, count: g.count, winRate: d ? w / d : null };
  });

  const bySupplier = topN(groupBy(normalized, (r) => r.supplier), 8);
  const byShippingStatus = topN(groupBy(normalized, (r) => r.shippingStatus), 8);

  return {
    kpis: [
      { label: "Tổng case", value: total },
      { label: "Win rate", value: decided ? `${((wins / decided) * 100).toFixed(1)}%` : "N/A", sub: `${wins}W / ${losses}L` },
      { label: "Backlog quá hạn", value: backlog },
      { label: "Case khách không phản hồi", value: noResponseCount },
    ],
    monthly,
    breakdowns: { byCaseReason, bySupplier, byShippingStatus },
    winRateByReason: winRateByReason.sort((a, b) => b.count - a.count).slice(0, 8),
    // Raw per-case list (with `channel`) — used by analyze/channelWorkload.js
    // to compute issue rate per channel; not rendered directly by this tab.
    cases: normalized,
    updatedAt: Date.now(),
  };
}
