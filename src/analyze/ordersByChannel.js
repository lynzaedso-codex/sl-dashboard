import { asText, asNumber, asDate, monthKey, monthLabel, weekKey, weekLabel, groupBy, topN } from "../utils.js";
import { ORDER_TABLES } from "../config.js";

// Fixed, config-driven — not derived from the fetched window — so a channel
// with zero orders in the current window still gets its own chart line
// instead of silently disappearing.
const ALL_CHANNELS = [...new Set(ORDER_TABLES.map((t) => t.channel))];

// `tablesData` is [{ table, rows }] — one entry per ORDER_TABLES config,
// already fetched from Lark. Each table has its own field-name mapping
// (config.js) since every channel's sheet was hand-built independently.
export function analyzeOrdersByChannel(tablesData) {
  const normalized = [];

  for (const { table, rows } of tablesData) {
    const f = table.fields;
    for (const r of rows) {
      const date = f.date ? asDate(r[f.date]) : null;
      normalized.push({
        table: table.name,
        channel: table.channel,
        store: f.store ? asText(r[f.store]) || table.name : table.name,
        orderNumber: f.orderNumber ? asText(r[f.orderNumber]) : "",
        qty: f.qty ? asNumber(r[f.qty]) || 1 : 1,
        fee: f.fee ? asNumber(r[f.fee]) : 0,
        cogs: f.cogs ? asNumber(r[f.cogs]) : 0,
        buyLabel: f.buyLabel ? asNumber(r[f.buyLabel]) : 0,
        date,
        monthKey: date ? monthKey(date) : "Unknown",
        weekKey: date ? weekKey(date) : "Unknown",
      });
    }
  }

  const totalOrders = normalized.length;
  const totalQty = normalized.reduce((s, r) => s + r.qty, 0);
  const totalFee = normalized.reduce((s, r) => s + r.fee, 0);
  const totalCogs = normalized.reduce((s, r) => s + r.cogs, 0);
  const totalBuyLabel = normalized.reduce((s, r) => s + r.buyLabel, 0);

  const byChannel = topN(groupBy(normalized, (r) => r.channel, ["fee", "cogs", "buyLabel", "qty"]), 8);
  const byStore = topN(groupBy(normalized, (r) => r.store, ["fee", "cogs", "buyLabel", "qty"]), 12);

  function bucketByChannel(keyOf, labelFn) {
    const keys = [...new Set(normalized.map((r) => keyOf(r)))].filter((k) => k !== "Unknown").sort();
    return keys.map((key) => {
      const row = { key, label: labelFn(key) };
      for (const ch of ALL_CHANNELS) {
        row[ch] = normalized.filter((r) => keyOf(r) === key && r.channel === ch).length;
      }
      return row;
    });
  }

  const monthlyByChannel = bucketByChannel((r) => r.monthKey, monthLabel);
  const weeklyByChannel = bucketByChannel((r) => r.weekKey, weekLabel);

  return {
    kpis: [
      { label: "Tổng đơn", value: totalOrders },
      { label: "Tổng SL", value: totalQty },
      { label: "Tổng Fee", value: `$${totalFee.toFixed(2)}` },
      { label: "Tổng COGS + label", value: `$${(totalCogs + totalBuyLabel).toFixed(2)}` },
    ],
    channels: ALL_CHANNELS,
    monthlyByChannel,
    weeklyByChannel,
    byChannel,
    byStore,
    updatedAt: Date.now(),
  };
}
