import { normalizeChannelKey } from "../utils.js";

const CHANNEL_KEYS = ["ETSY", "AMZ", "TIKTOK", "WEBSITE"];

// Issue rate = (Cancel/Refund + PayPal Dispute cases) / (orders handled),
// per CHANNEL — not per account/supporter. Order tables' `Store` field and
// Report Performance's `Account` field use different naming with no
// confirmed 1:1 mapping (user confirmed they don't match), so this stops at
// channel-level aggregation for now. FBA Issues is excluded on purpose: that
// table has no account/channel field to join by, and per the user it isn't
// really a CS-driven metric anyway. WEBSITE has no "orders" at all — its
// `volume` stays 0 until Zendesk ticket counts are wired in.
export function analyzeChannelWorkload(cancelRefundCases, paypalCases, orderTablesData) {
  const orderVolumeByChannel = {};
  for (const { table, rows } of orderTablesData) {
    const key = normalizeChannelKey(table.channel);
    if (!key) continue;
    orderVolumeByChannel[key] = (orderVolumeByChannel[key] || 0) + rows.length;
  }

  const issuesByChannel = {};
  const bump = (raw) => {
    const key = normalizeChannelKey(raw);
    if (!key) return;
    issuesByChannel[key] = (issuesByChannel[key] || 0) + 1;
  };
  for (const c of cancelRefundCases) bump(c.channel);
  for (const c of paypalCases) bump(c.channel);

  const result = {};
  for (const key of CHANNEL_KEYS) {
    const volume = orderVolumeByChannel[key] || 0;
    const issues = issuesByChannel[key] || 0;
    result[key] = { volume, issues, issueRate: volume ? (issues / volume) * 100 : null };
  }
  return result;
}
