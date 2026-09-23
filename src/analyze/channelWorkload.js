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

  // Lightweight per-issue list (not the full case objects) so a click on the
  // "Issue rate theo kênh" table can drill into what those issues actually
  // are, instead of just the count.
  const issuesByChannel = {};
  const bump = (key, entry) => {
    issuesByChannel[key] = issuesByChannel[key] || [];
    issuesByChannel[key].push(entry);
  };
  for (const c of cancelRefundCases) {
    const key = normalizeChannelKey(c.channel);
    if (!key) continue;
    bump(key, { source: "Cancel/Refund", date: c.date, store: c.store, label: c.reason, detail: c.detail, cost: c.cost });
  }
  for (const c of paypalCases) {
    const key = normalizeChannelKey(c.channel);
    if (!key) continue;
    bump(key, { source: "PayPal Dispute", date: c.dateDispute ? c.dateDispute.getTime() : null, store: c.store, label: c.caseReason, detail: c.update, cost: null });
  }

  const result = {};
  for (const key of CHANNEL_KEYS) {
    const volume = orderVolumeByChannel[key] || 0;
    const issueList = (issuesByChannel[key] || []).sort((a, b) => (b.date || 0) - (a.date || 0));
    const issues = issueList.length;
    result[key] = { volume, issues, issueRate: volume ? (issues / volume) * 100 : null, issueList };
  }
  return result;
}
