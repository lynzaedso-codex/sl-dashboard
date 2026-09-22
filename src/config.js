// Lark Base + table map. Read-only everywhere — no field here is ever written back.

export const LARK_APP_TOKEN = "NMzKbxBLqa71FzskfWmu8zwis5d";

export const TABLES = {
  cancelRefund: { id: "tblIsO2xwULCKcUk", name: "CC&RF" },
  ttsCancelRefund: { id: "tblHeww9S96lVq1Y", name: "TTS CC.RF.RS" },
  channelPerformance: { id: "tbl8rtAxXHq2fah6", name: "Report Performance" },
  fbaIssues: { id: "tbl8NyuFzkRmHdfB", name: "FBA - SUP duty" },
  paypalDispute: { id: "tblwiRjezwLzsIh4", name: "PayPal" },
};

// Review tables — feed the Channel Performance "review recovery" signal
// (analyze/reviews.js). Table ID order confirmed by the user.
export const REVIEW_TABLES = {
  amzReviewFbVoice: { id: "tblmqmZBHZqKUJmO", name: "AMZ Review-FB-Voice" },
  etsyReview2026: { id: "tblGqrTApP2O950Y", name: "Etsy Review 2026" },
  tiktokReview: { id: "tbldK62oJOPX20rQ", name: "Tiktok Review" },
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

// `Report Performance` holds all 4 channel groups (ETSY/AMZ/TIKTOK/WEBSITE)
// in ONE table — `Channel` picks which group's columns are populated on a
// given row. The Lark field literally used for the website group is "WEB",
// not "WEBSITE" — keep the internal key readable, map to the real value here.
export const CHANNEL_LARK_VALUE = { ETSY: "ETSY", AMZ: "AMZ", TIKTOK: "TIKTOK", WEBSITE: "WEB" };

// account -> supporter (CS). From the "Assign acc" sheet — a fixed snapshot
// for now; the user said they'll report changes rather than have this pulled
// from a live table (no such table exists in Lark today).
export const CS_MAP = {
  FallingGlamour: "Heny", SpecialJoyGifts: "Heny", LushLantern: "Heny", TelomereTB: "Heny",
  TrendyParrot: "Băng Trang (Tracy)", CatchyPetals: "Băng Trang (Tracy)", HeartCraftedWonders: "Băng Trang (Tracy)",
  FallingLoveGifts: "Băng Trang (Tracy)", CraftCornerForAll: "Băng Trang (Tracy)", LumeQuill: "Băng Trang (Tracy)", Flagwix: "Băng Trang (Tracy)",
  MoonberryGoods: "Diệu Linh (Nồ)", MerryHeartFinds: "Diệu Linh (Nồ)", SeeGox: "Diệu Linh (Nồ)", PEATAUS: "Diệu Linh (Nồ)", IvyCharmIndigo: "Diệu Linh (Nồ)", OmyzraStore: "Diệu Linh (Nồ)",
  "AMZ-FLW": "Ái Ni", "AMZ-GMB": "Ái Ni", "AMZ-TWD": "Ái Ni", "AMZ-OAS": "Ái Ni", "AMZ-AXI": "Ái Ni", "AMZ-AVX": "Ái Ni", "AMZ-PLX": "Ái Ni", "AMZ-GAU": "Ái Ni", "AMZ-WPX": "Ái Ni",
  "WEB-MAIL-NI": "Ái Ni", "WEB-FB-UniqueFlag": "Ái Ni", "WEB-FB-FLW": "Ái Ni",
  Teezwonder: "Nguyệt", Oassie: "Nguyệt", "WEB-MAIL-NGUYET": "Nguyệt",
  "WEB-MAIL-HENY": "Heny",
};

// Per-channel KPI targets for the Channel Performance tab — locked with the
// user against `Report Performance`'s real column names and the "H1-2026
// Performance Review" Quality Criteria sheet. Pure pass/fail against a single
// number per KPI (no weighted scoring) — `direction: "higher"` passes at
// `value >= threshold`, `"lower"` at `value <= threshold`, `"bool"` at
// truthy. `warnMargin` (same unit as the field) marks a passing value as
// "cận ngưỡng" when it's within that margin of the threshold; omit it for
// KPIs with no such nuance (e.g. an exact-match count).
export const CHANNEL_PERF_TARGETS = {
  ETSY: [
    { key: "response", field: "Response rate", label: "Response rate", unit: "%", threshold: 99, direction: "higher", warnMargin: 0.6 },
    { key: "tracking", field: "Tracking rate", label: "Tracking rate", unit: "%", threshold: 98, direction: "higher", warnMargin: 0.6 },
    { key: "reviewRate", field: "Review rate (ETSY)", label: "Review rate", unit: "★", threshold: 4.8, direction: "higher", warnMargin: 0.05 },
    { key: "caseRate", field: "Case rate", label: "Case rate", unit: "%", threshold: 0.2, direction: "lower", warnMargin: 0.04 },
    { key: "starSeller", field: "Star Seller", label: "Star Seller", unit: "", threshold: null, direction: "bool" },
  ],
  AMZ: [
    // ODR is a derived total (Negative feedback + A-Z claims + Chargeback), not its own
    // Lark column — see computeAmzOdr() in analyze/channelPerformance.js.
    { key: "odr", field: null, label: "ODR tổng", unit: "%", threshold: 0.7, direction: "lower", warnMargin: 0.08 },
    { key: "negFeedback", field: "Negative feeback", label: "Negative feedback", unit: "%", threshold: 0.42, direction: "lower", warnMargin: 0.05 },
    { key: "azClaims", field: "A-Z claims", label: "A-Z claims", unit: "%", threshold: 0.21, direction: "lower", warnMargin: 0.03 },
    { key: "chargeback", field: "Chargback claims", label: "Chargeback", unit: "%", threshold: 0.07, direction: "lower", warnMargin: 0.02 },
    { key: "lateShip", field: "Late shipment rate", label: "Late shipment", unit: "%", threshold: 3, direction: "lower", warnMargin: 0.4 },
    { key: "tracking", field: "Valid tracking rate", label: "Valid tracking", unit: "%", threshold: 97, direction: "higher", warnMargin: 0.6 },
    { key: "onTime", field: "On-time delivery rate", label: "On-time delivery", unit: "%", threshold: 95, direction: "higher", warnMargin: 0.6 },
  ],
  TIKTOK: [
    { key: "negReview", field: "60-Day Negative Review Rate (1.26)", label: "Negative review", unit: "%", threshold: 1.26, direction: "lower", warnMargin: 0.15 },
    { key: "nonBuyerRR", field: "60-Day Non-Buyer Fault R&R Rate (1.76)", label: "Non-buyer R&R", unit: "%", threshold: 1.76, direction: "lower", warnMargin: 0.2 },
    { key: "sellerCancel", field: "30-Day Seller Fault Cancellation Rate (0.87)", label: "Seller cancel", unit: "%", threshold: 0.87, direction: "lower", warnMargin: 0.1 },
    { key: "onTime", field: "30-Day On-Time Delivery Rate (95.16)", label: "On-time delivery", unit: "%", threshold: 95.16, direction: "higher", warnMargin: 0.5 },
    { key: "afterSalesHrs", field: "60-Day After-Sales Handling Time (26.5)", label: "After-sales time", unit: "h", threshold: 26.5, direction: "lower", warnMargin: 2 },
    { key: "imDissatisfaction", field: "60-Day IM Dissatisfaction Rate (17.01)", label: "IM dissatisfaction", unit: "%", threshold: 17.01, direction: "lower", warnMargin: 1.5 },
    { key: "sps", field: "SPS", label: "Shop score", unit: "", threshold: 4.5, direction: "higher", warnMargin: 0.1 },
  ],
  WEBSITE: [
    { key: "csat", field: "CSAT", label: "CSAT", unit: "%", threshold: 90, direction: "higher", warnMargin: 2 },
    { key: "responseTime", field: "Response Time", label: "Response time", unit: "h", threshold: 9, direction: "lower", warnMargin: 1 },
    { key: "ticketOver24h", field: "Ticket >24h", label: "Ticket > 24h", unit: "", threshold: 0, direction: "lower" },
  ],
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
