import { asText, asNumber, asDate, monthKey, monthLabel } from "../utils.js";
import { CHANNEL_HEALTH_THRESHOLDS } from "../config.js";

const METRICS = [
  "A-Z claims",
  "Chargback claims",
  "Late shipment rate",
  "Negative feeback",
  "On-time delivery rate",
  "Review rate (AMZ)",
  "Seller ODR <0.5%",
  "Valid tracking rate",
];

// "Higher is better" metrics warn when they DROP below the threshold; the
// rest (claim/complaint rates) warn when they RISE above it.
const HIGHER_IS_BETTER = new Set(["Valid tracking rate", "On-time delivery rate"]);

export function analyzeChannelPerformance(rows) {
  const normalized = rows.map((r) => {
    const date = asDate(r["Date Report"]);
    const metrics = {};
    for (const m of METRICS) metrics[m] = asNumber(r[m]);
    return {
      account: asText(r["Account"]) || "Unknown",
      channel: asText(r["Channel"]) || "Unknown",
      date,
      monthKey: date ? monthKey(date) : "Unknown",
      metrics,
    };
  });

  const accounts = [...new Set(normalized.map((r) => r.account))].sort();

  // Latest snapshot per account (most recent Date Report).
  const latestByAccount = {};
  for (const r of normalized) {
    const current = latestByAccount[r.account];
    if (!current || (r.date && current.date && r.date > current.date)) {
      latestByAccount[r.account] = r;
    }
  }

  const alerts = [];
  for (const account of accounts) {
    const snap = latestByAccount[account];
    if (!snap) continue;
    for (const [metric, threshold] of Object.entries(CHANNEL_HEALTH_THRESHOLDS)) {
      const value = snap.metrics[metric];
      if (value === undefined) continue;
      const breached = HIGHER_IS_BETTER.has(metric) ? value < threshold : value > threshold;
      if (breached) {
        alerts.push({ account, metric, value, threshold, direction: HIGHER_IS_BETTER.has(metric) ? "below" : "above" });
      }
    }
  }

  // Monthly series per metric, averaged across accounts that reported that month.
  const monthKeys = [...new Set(normalized.map((r) => r.monthKey))].sort();
  const monthlyByMetric = {};
  for (const metric of METRICS) {
    monthlyByMetric[metric] = monthKeys.map((key) => {
      const rowsInMonth = normalized.filter((r) => r.monthKey === key);
      const avg = rowsInMonth.length ? rowsInMonth.reduce((s, r) => s + r.metrics[metric], 0) / rowsInMonth.length : 0;
      return { key, label: monthLabel(key), value: avg };
    });
  }

  const accountTable = accounts.map((account) => ({
    account,
    channel: latestByAccount[account]?.channel || "Unknown",
    metrics: latestByAccount[account]?.metrics || {},
  }));

  return {
    kpis: [
      { label: "Số account theo dõi", value: accounts.length },
      { label: "Cảnh báo đang mở", value: alerts.length },
    ],
    accountTable,
    monthlyByMetric,
    alerts,
    metricList: METRICS,
    updatedAt: Date.now(),
  };
}
