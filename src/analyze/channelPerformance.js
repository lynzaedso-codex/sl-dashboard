import { asText, asNumber, asDate, normalizeVN, weekKey, weekLabel } from "../utils.js";
import { CHANNEL_PERF_TARGETS, CHANNEL_LARK_VALUE } from "../config.js";

const CHANNEL_KEYS = Object.keys(CHANNEL_PERF_TARGETS);

function channelForLarkValue(raw) {
  const v = raw.trim().toUpperCase();
  return CHANNEL_KEYS.find((k) => CHANNEL_LARK_VALUE[k] === v) || null;
}

// `%`-unit fields come back from Lark as a 0-1 fraction (confirmed against
// real rows: "Seller ODR <0.5%" = 0.001, "Valid tracking rate" = 0.9879,
// TikTok's "...Rate (1.26)" columns = 0.0013 etc.) — normalize all of them to
// plain percentage numbers so every threshold in config.js can be written in
// the same "99" / "0.7" percentage units the user actually thinks in.
// NOTE: TikTok's "60-Day After-Sales Handling Time" raw values look small
// enough (0.093, 0.219) that they may be a fraction of a day rather than
// plain hours — used as-is here (unit "h", no conversion). Worth spot-checking
// one real row against Lark before trusting that column's pass/fail.
function readMetricValue(row, m) {
  const raw = row[m.field];
  if (m.direction === "bool") return normalizeVN(asText(raw)).trim() === "dat";
  const n = asNumber(raw);
  return m.unit === "%" ? n * 100 : n;
}

// Ships raw per-account weekly history (not pre-computed pass/fail) — the
// dashboard template applies CHANNEL_PERF_TARGETS client-side, the same way
// it already does for Cancel/Refund's live filters. Missing weeks for an
// account read as `null` (no report that week), not a fail.
export function analyzeChannelPerformance(rows) {
  const perChannelAccountWeek = {}; // channel -> account -> weekKey -> { metricKey: value }
  const weekKeysSeen = new Set();

  for (const r of rows) {
    const channel = channelForLarkValue(asText(r["Channel"]));
    if (!channel) continue;
    const account = asText(r["Account"]).trim();
    if (!account) continue;
    const date = asDate(r["Date Report"]);
    const wk = date ? weekKey(date) : null;
    if (!wk) continue;
    weekKeysSeen.add(wk);

    const values = {};
    for (const m of CHANNEL_PERF_TARGETS[channel]) {
      if (!m.field) continue; // derived metric (AMZ's ODR) — filled in below
      values[m.key] = readMetricValue(r, m);
    }
    if (channel === "AMZ") {
      values.odr = (values.negFeedback || 0) + (values.azClaims || 0) + (values.chargeback || 0);
    }

    perChannelAccountWeek[channel] = perChannelAccountWeek[channel] || {};
    perChannelAccountWeek[channel][account] = perChannelAccountWeek[channel][account] || {};
    perChannelAccountWeek[channel][account][wk] = values;
  }

  const weeks = Array.from(weekKeysSeen)
    .sort()
    .map((key) => ({ key, label: weekLabel(key) }));

  const channels = {};
  for (const channel of CHANNEL_KEYS) {
    const byAccount = perChannelAccountWeek[channel] || {};
    channels[channel] = {
      accounts: Object.keys(byAccount)
        .sort()
        .map((account) => {
          const byWeek = byAccount[account];
          const history = {};
          for (const m of CHANNEL_PERF_TARGETS[channel]) {
            history[m.key] = weeks.map((w) => (byWeek[w.key] ? byWeek[w.key][m.key] : null));
          }
          return { account, history };
        }),
    };
  }

  return { weeks, channels, updatedAt: Date.now() };
}
