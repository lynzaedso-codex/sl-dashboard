// Lark Base + table map. Read-only everywhere — no field here is ever written back.

export const LARK_APP_TOKEN = "NMzKbxBLqa71FzskfWmu8zwis5d";

export const TABLES = {
  cancelRefund: { id: "tblIsO2xwULCKcUk", name: "CC&RF" },
  ttsCancelRefund: { id: "tblHeww9S96lVq1Y", name: "TTS CC.RF.RS" },
  channelPerformance: { id: "tbl8rtAxXHq2fah6", name: "Report Performance" },
  fbaIssues: { id: "tbl8NyuFzkRmHdfB", name: "FBA - SUP duty" },
  paypalDispute: { id: "tblwiRjezwLzsIh4", name: "PayPal" },
};

// Each order table has its own hand-built schema — mapped explicitly rather
// than guessed, since field names/casing differ per channel.
export const ORDER_TABLES = [
  {
    id: "tbljXyNTwYiPw1Aa",
    name: "FF FBA",
    channel: "Website/POD",
    fields: {
      orderNumber: "ORDER NUMBER",
      date: "FF Date",
      qty: "QTY",
      fee: "Fee AMZ",
      cogs: "Cost",
      store: "Store order",
    },
  },
  {
    id: "tblJYXIYEBDF6pva",
    name: "AMZ FBM BASE",
    channel: "Amazon FBM",
    fields: {
      orderNumber: "AMZ Order ID",
      date: "Purchase date",
      qty: "Quantity purchased",
      fee: "TOTAL",
      store: "Store",
    },
  },
  {
    id: "tblmDDUrzUkUzjkO",
    name: "Telani Orders",
    channel: "Etsy",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Quantity*",
      cogs: "Order total Cost",
      store: "ACCOUNT",
    },
  },
  {
    id: "tblCGlo33QfEe2CD",
    name: "TWD11-12",
    channel: "TikTok Shop",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Qty",
      fee: "Fee AMZ",
      cogs: "Cost Supplier",
      buyLabel: "Cost + Buy Tiktok label",
      store: "STORE",
    },
  },
  {
    id: "tblrfoE2h8iZbsBu",
    name: "shinewines",
    channel: "TikTok Shop",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Qty",
      fee: "Fee AMZ",
      cogs: "Cost Supplier",
      buyLabel: "Cost + tiktok label",
      store: "Store",
    },
  },
  {
    id: "tblr5wbEgoWr1M6L",
    name: "TTS Oassie",
    channel: "TikTok Shop",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Qty",
      fee: "Fee AMZ",
      cogs: "Cost Supplier",
      buyLabel: "Cost + tiktok label",
      store: "Store",
    },
  },
  {
    id: "tbl4IEEDXZRcANSK",
    name: "GMB",
    channel: "TikTok Shop",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Qty",
      fee: "Fee AMZ",
      cogs: "Cost Supplier",
      store: "store",
    },
  },
  {
    id: "tblPao2fr6SqFGNy",
    name: "TTS Arvexo",
    channel: "TikTok Shop",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Qty",
      fee: "Fee AMZ",
      cogs: "Cost Supplier",
      store: "store",
    },
  },
  {
    id: "tbleMrveXHT34t6G",
    name: "TTS Axiara",
    channel: "TikTok Shop",
    fields: {
      orderNumber: "Order Number",
      date: "Order date",
      qty: "Qty",
      fee: "Fee AMZ",
      cogs: "Cost Supplier",
      store: "store",
    },
  },
];

// Amazon seller-account health thresholds (standard AMZ policy floors),
// used to flag rows in the Channel Performance tab.
export const CHANNEL_HEALTH_THRESHOLDS = {
  "Seller ODR <0.5%": 0.005,
  "Late shipment rate": 0.04,
  "Valid tracking rate": 0.95, // below this is a warning (higher is better)
  "On-time delivery rate": 0.97, // below this is a warning (higher is better)
};

// Keywords scanned in PayPal "Update" notes to flag the "customer unresponsive" theme.
export const NO_RESPONSE_KEYWORDS = [
  "no reply",
  "không phản hồi",
  "khong phan hoi",
  "chưa phản hồi",
  "không rep",
  "no response",
  "unresponsive",
];

// The Worker only ever reads these two keys (see src/index.js). They're
// written by the GitHub Actions job (scripts/build-and-publish.mjs) after
// it fetches all 14 Lark tables and builds the dashboard in one run — see
// .github/workflows/refresh-dashboard.yml for how that's triggered.
export const KV_KEY = "dashboard:html";
export const KV_KEY_DATA = "dashboard:data";
