import { asText, asNumber, asDate, monthKey, monthLabel, groupBy, topN, sortedEntries } from "../utils.js";

// Sources: CC&RF (has reliable dates) + TTS CC.RF.RS (TikTok Shop cancels —
// the Year field in that table is broken data ("1899" on every row seen), so
// its rows feed totals/breakdowns but are excluded from the monthly trend.
export function analyzeCancelRefund(ccrfRows, ttsRows) {
  const normalized = [];

  for (const r of ccrfRows) {
    const date = asDate(r["Date"]) || asDate(r["Order date"]);
    normalized.push({
      source: "CC&RF",
      caseType: asText(r["Case status"]) || "Unknown",
      channel: asText(r["Channel"]) || "Unknown",
      store: asText(r["Store"]) || "Unknown",
      product: asText(r["Product"]) || "Unknown",
      agent: asText(r["Person"]) || "Unknown",
      amount: asNumber(r["Rf amount"]),
      reason: asText(r["Details Problem"]),
      date,
      monthKey: date ? monthKey(date) : null,
    });
  }

  for (const r of ttsRows) {
    normalized.push({
      source: "TTS CC.RF.RS",
      caseType: asText(r["Type"]) || "Unknown",
      channel: "TikTok Shop",
      store: asText(r["Store"]) || "Unknown",
      product: "Unknown",
      agent: "Unknown",
      amount: asNumber(r["Seller cancel amount"]),
      reason: asText(r["Reason"]),
      date: null,
      monthKey: null,
    });
  }

  const total = normalized.length;
  const refundCount = normalized.filter((r) => /refund/i.test(r.caseType)).length;
  const cancelCount = normalized.filter((r) => /cancel/i.test(r.caseType)).length;
  const totalAmount = normalized.reduce((s, r) => s + r.amount, 0);

  const withDate = normalized.filter((r) => r.monthKey);
  const monthlyGroups = groupBy(withDate, (r) => r.monthKey, ["amount"]);
  for (const key of Object.keys(monthlyGroups)) {
    const rowsInMonth = withDate.filter((r) => r.monthKey === key);
    monthlyGroups[key].refund = rowsInMonth.filter((r) => /refund/i.test(r.caseType)).length;
    monthlyGroups[key].cancel = rowsInMonth.filter((r) => /cancel/i.test(r.caseType)).length;
  }
  const monthly = Object.values(monthlyGroups)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((g) => ({ ...g, label: monthLabel(g.key) }));

  const byChannel = topN(groupBy(normalized, (r) => r.channel, ["amount"]), 8);
  const byStore = topN(groupBy(normalized, (r) => r.store, ["amount"]), 8);
  const byProduct = topN(groupBy(normalized.filter((r) => r.product !== "Unknown"), (r) => r.product, ["amount"]), 8);
  const byAgent = topN(groupBy(normalized.filter((r) => r.agent !== "Unknown"), (r) => r.agent, ["amount"]), 8);

  const reasonCounts = {};
  for (const r of normalized) {
    const reason = r.reason.trim();
    if (!reason) continue;
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }
  const topReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    kpis: [
      { label: "Tổng case", value: total },
      { label: "Refund", value: refundCount, sub: total ? `${((refundCount / total) * 100).toFixed(1)}%` : "0%" },
      { label: "Cancel", value: cancelCount, sub: total ? `${((cancelCount / total) * 100).toFixed(1)}%` : "0%" },
      { label: "Tổng tiền refund", value: `$${totalAmount.toFixed(2)}` },
    ],
    monthly,
    breakdowns: { byChannel, byStore, byProduct, byAgent },
    topReasons,
    updatedAt: Date.now(),
  };
}
