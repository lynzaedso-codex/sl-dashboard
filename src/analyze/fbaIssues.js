import { asText, asDate, monthKey, monthLabel, groupBy, topN } from "../utils.js";

export function analyzeFbaIssues(rows) {
  const normalized = rows.map((r) => {
    const date = asDate(r["Date issue"]);
    const resendPlace = asText(r["Resend place"]);
    const rsOrder = asText(r["RS order"]);
    const extraResend = asText(r["Extra resend"]);
    return {
      date,
      monthKey: date ? monthKey(date) : "Unknown",
      supplier: asText(r["SUPPLIER sx hàng"]) || "Unknown",
      ffPlace: asText(r["FF place gốc"]) || "Unknown",
      productType: asText(r["PRODUCT TYPE"]) || "Unknown",
      issue: asText(r["ISSUE"]).trim(),
      cs: asText(r["CS"]) || "Unknown",
      resent: Boolean(resendPlace || rsOrder || extraResend),
    };
  });

  const total = normalized.length;
  const resentCount = normalized.filter((r) => r.resent).length;

  const monthlyGroups = groupBy(normalized, (r) => r.monthKey);
  const monthly = Object.values(monthlyGroups)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((g) => ({ ...g, label: monthLabel(g.key) }));

  const bySupplier = topN(groupBy(normalized, (r) => r.supplier), 8);
  const byFfPlace = topN(groupBy(normalized, (r) => r.ffPlace), 8);
  const byProductType = topN(groupBy(normalized, (r) => r.productType), 8);
  const byCs = topN(groupBy(normalized.filter((r) => r.cs !== "Unknown"), (r) => r.cs), 8);

  const issueCounts = {};
  for (const r of normalized) {
    if (!r.issue) continue;
    issueCounts[r.issue] = (issueCounts[r.issue] || 0) + 1;
  }
  const topIssues = Object.entries(issueCounts)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    kpis: [
      { label: "Tổng issue", value: total },
      { label: "Đã resend", value: resentCount, sub: total ? `${((resentCount / total) * 100).toFixed(1)}%` : "0%" },
      { label: "Chưa resend", value: total - resentCount },
    ],
    monthly,
    breakdowns: { bySupplier, byFfPlace, byProductType, byCs },
    topIssues,
    updatedAt: Date.now(),
  };
}
