import { asText, asNumber, asDate, monthKey, monthLabel, weekKey, weekLabel, groupBy, normalizeVN } from "../utils.js";
import { classifyReason } from "../reasonTaxonomy.js";

// "Lọc Asin (FBA)" rows are an internal ASIN-check operation, not a real
// customer cancel/refund — excluded so they don't inflate the case counts.
function isAsinFilterCase(detail) {
  return normalizeVN(detail).includes("loc asin");
}

// Ships raw, per-case rows (`cases`) instead of server-precomputed
// breakdowns — the dashboard filters by date range / channel / store in the
// browser and recomputes KPIs, breakdowns, and the reason×product cross
// table live from this list (see dashboard-template.js). `monthly` (merged
// into KV history by analyze/index.js — years of history over time) and
// `weekly` (computed fresh from this run's 60-day window — always covers
// at least the last few complete weeks) are both server-computed and NOT
// affected by the sample-inspection filter; the Overview tab uses `weekly`
// for its week-over-week comparison.
export function analyzeCancelRefund(ccrfRows, ttsRows) {
  const cases = [];

  for (const r of ccrfRows) {
    const detail = asText(r["Details Problem"]);
    if (isAsinFilterCase(detail)) continue;
    const date = asDate(r["Date"]) || asDate(r["Order date"]);
    const statusText = asText(r["Case status"]);
    cases.push({
      source: "CC&RF",
      caseId: asText(r["Order ID"]) || asText(r["Order Number"]) || "",
      date: date ? date.getTime() : null,
      channel: asText(r["Channel"]) || "Unknown",
      store: asText(r["Store"]) || "Unknown",
      product: asText(r["Product"]) || "Unknown",
      agent: asText(r["Person"]) || "Unknown",
      type: /refund/i.test(statusText) ? "Refund" : /cancel/i.test(statusText) ? "Cancel" : "Khác",
      qty: asNumber(r["Qty"]) || 1,
      cost: asNumber(r["Rf amount"]),
      reason: classifyReason(detail),
      detail,
    });
  }

  for (const r of ttsRows) {
    const detail = asText(r["Reason"]);
    if (isAsinFilterCase(detail)) continue;
    const date = asDate(r["Date"]);
    const typeText = asText(r["Type"]);
    cases.push({
      source: "TTS CC.RF.RS",
      caseId: asText(r["Order Shopify"]) || asText(r["Order tts"]) || "",
      date: date ? date.getTime() : null,
      channel: "TikTok Shop",
      store: asText(r["Store"]) || "Unknown",
      product: "Unknown",
      agent: "Unknown",
      type: /cancel/i.test(typeText) ? "Cancel" : /refund/i.test(typeText) ? "Refund" : "Khác",
      qty: 1,
      cost: asNumber(r["Seller cancel amount"]),
      reason: classifyReason(detail),
      detail,
    });
  }

  const withDate = cases.filter((c) => c.date);

  function bucket(keyFn, labelFn) {
    const groups = groupBy(withDate, (c) => keyFn(new Date(c.date)), ["cost"]);
    for (const key of Object.keys(groups)) {
      const inBucket = withDate.filter((c) => keyFn(new Date(c.date)) === key);
      groups[key].refund = inBucket.filter((c) => c.type === "Refund").length;
      groups[key].cancel = inBucket.filter((c) => c.type === "Cancel").length;
    }
    return Object.values(groups)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((g) => ({ ...g, label: labelFn(g.key) }));
  }

  const monthly = bucket(monthKey, monthLabel);
  const weekly = bucket(weekKey, weekLabel);

  return { cases, monthly, weekly, updatedAt: Date.now() };
}
