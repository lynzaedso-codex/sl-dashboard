// Builds a standalone preview HTML (for the Artifact tool) using realistic
// fake data — NOT real Lark data (network access to the live Worker is
// blocked from this environment). Not part of the shipped project.
import { analyzeCancelRefund } from "../src/analyze/cancelRefund.js";
import { analyzeChannelPerformance } from "../src/analyze/channelPerformance.js";
import { analyzeFbaIssues } from "../src/analyze/fbaIssues.js";
import { analyzePaypalDispute } from "../src/analyze/paypalDispute.js";
import { analyzeOrdersByChannel } from "../src/analyze/ordersByChannel.js";
import { ORDER_TABLES } from "../src/config.js";
import { renderDashboard } from "../src/dashboard-template.js";
import fs from "fs";

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { return Date.now() - n * 86400000; }

const AGENTS = ["Băng Trang (Tracy)_CS", "Diệu Linh (Nỗ)_CS", "Nguyet_CS", "Heny_CS", "Ái Ni ( CS )", "Nguyễn Gia Linh"];
const CHANNELS = ["ETSY", "AMZ", "TikTok Shop", "Website"];
const STORES = { ETSY: ["FLW", "CatchyPetals", "FallingGlamour", "SpecialJoyGifts"], AMZ: ["AMZFLW", "AMZ-GMB"], "TikTok Shop": ["TTS OASSIE", "TTS TWD", "TTSFLW"], Website: ["FLW"] };
const PRODUCTS = ["Ornament", "Jewelry Dish", "Ring Dish", "Mug", "Night Light", "Photo Frame", "Tumbler", "Blanket"];
const REASON_DETAILS = [
  "khách muốn cc, không rõ lý do",
  "item bị vỡ khi vận chuyển, hoàn tiền",
  "thất lạc giao hàng, khách chưa nhận được",
  "thiếu địa chỉ, không liên lạc được với khách",
  "trễ so với ngày khách cần, khách huỷ",
  "thiếu thông tin customization, chưa gửi kịp",
  "khách không hài lòng chất lượng in",
  "lỗi base sản phẩm, hoàn một phần",
  "khách không áp được mã giảm giá, huỷ đơn",
  "coupon hết hạn, khách muốn cc",
  "sup gửi sai mẫu, khách yêu cầu hoàn tiền",
  "sup gửi thiếu phụ kiện đi kèm",
  "in lệch vị trí so với mockup",
];

const ccrfRows = [];
for (let i = 0; i < 140; i++) {
  const channel = rand(CHANNELS);
  const store = rand(STORES[channel]);
  const daysBack = Math.floor(Math.random() * 58);
  const isRefund = Math.random() < 0.35;
  ccrfRows.push({
    "Case status": isRefund ? "Refund" : "Cancel",
    Channel: [channel],
    Date: daysAgo(daysBack),
    "Details Problem": rand(REASON_DETAILS),
    Store: store,
    Product: [rand(PRODUCTS)],
    Person: [{ name: rand(AGENTS) }],
    Qty: String(1 + Math.floor(Math.random() * 3)),
    "Rf amount": isRefund ? (Math.random() * 60).toFixed(2) : "0",
  });
}
// A few internal "Lọc Asin (FBA)" ops mixed in — should be excluded from
// every count/breakdown below, not just filtered out visually.
for (let i = 0; i < 6; i++) {
  ccrfRows.push({
    "Case status": "Cancel",
    Channel: ["AMZ"],
    Date: daysAgo(Math.floor(Math.random() * 58)),
    "Details Problem": "Lọc Asin (FBA)",
    Store: "AMZFLW",
    Product: [],
    Person: [{ name: rand(["Vân Hải", "Sảng"]) }],
    Qty: "1",
    "Rf amount": "0",
  });
}
const ttsRows = [];
for (let i = 0; i < 15; i++) {
  ttsRows.push({
    Type: "Cancel",
    Reason: rand(REASON_DETAILS),
    "Seller cancel amount": (Math.random() * 30).toFixed(2),
    Store: ["TTS TWD"],
    Date: daysAgo(Math.floor(Math.random() * 58)),
  });
}

const perfRows = ["AMZ-FLW", "AMZ-GMB", "AMZ-TWD"].map((acc) => ({
  Account: acc, Channel: "AMZ", "Date Report": daysAgo(5),
  "Seller ODR <0.5%": String((Math.random() * 0.012).toFixed(4)),
  "Late shipment rate": String((Math.random() * 0.06).toFixed(4)),
  "Valid tracking rate": String((0.9 + Math.random() * 0.1).toFixed(4)),
  "On-time delivery rate": String((0.93 + Math.random() * 0.07).toFixed(4)),
  "A-Z claims": "0", "Chargback claims": "0", "Negative feeback": "0", "Review rate (AMZ)": "4.7",
}));

const fbaRows = [];
for (let i = 0; i < 40; i++) {
  fbaRows.push({
    "Date issue": daysAgo(Math.floor(Math.random() * 58)),
    "SUPPLIER sx hàng": rand(["Jack", "Aluffm Tri Dang", "Printbelle", "printway"]),
    "FF place gốc": rand(["kho EMD", "kho aN", "AMZ"]),
    "PRODUCT TYPE": rand(["Grommet flag", "Ornament", "Night Light"]),
    ISSUE: rand(["thiếu grommet", "bị tưa", "lỗi in", "sai màu"]),
    CS: [{ name: rand(AGENTS) }],
    "Resend place": Math.random() < 0.6 ? "kho EMD" : "",
  });
}

const paypalRows = [];
for (let i = 0; i < 32; i++) {
  const daysBack = Math.floor(Math.random() * 58);
  paypalRows.push({
    "Case ID": "PP-" + i,
    "Case Reason": rand(["Unauthorized transaction", "Item not received", "Item not as described"]),
    "Case Status": rand(["Reviewing", "Won", "Lost"]),
    "Case Type": "Chargeback",
    Channel: "PayPal",
    "Date Dispute": daysAgo(daysBack),
    "Due date": daysAgo(daysBack - 14),
    Status: rand(["Delivered", "In transit", "Not found"]),
    Store: rand(STORES.ETSY),
    Supplier: rand(["Jack", "Aluffm Tri Dang"]),
    Update: Math.random() < 0.2 ? "contact mail khách no reply" : "đang xử lý",
  });
}

const orderTablesData = ORDER_TABLES.map((table) => ({
  table,
  rows: Array.from({ length: 10 + Math.floor(Math.random() * 30) }, () => ({
    [table.fields.orderNumber]: "ORD-" + Math.floor(Math.random() * 100000),
    [table.fields.date]: daysAgo(Math.floor(Math.random() * 58)),
    [table.fields.qty]: "1",
    ...(table.fields.fee ? { [table.fields.fee]: (5 + Math.random() * 10).toFixed(2) } : {}),
    ...(table.fields.cogs ? { [table.fields.cogs]: (2 + Math.random() * 5).toFixed(2) } : {}),
    ...(table.fields.store ? { [table.fields.store]: rand(STORES[table.channel] || ["STORE"]) } : {}),
  })),
}));

const data = {
  cancelRefund: analyzeCancelRefund(ccrfRows, ttsRows),
  channelPerformance: analyzeChannelPerformance(perfRows),
  fbaIssues: analyzeFbaIssues(fbaRows),
  paypalDispute: analyzePaypalDispute(paypalRows),
  ordersByChannel: analyzeOrdersByChannel(orderTablesData),
  generatedAt: Date.now(),
};

const full = renderDashboard(data);

// Strip the outer <!doctype>/<html>/<head>/<body> skeleton the Artifact tool
// already provides — keep our own <title> + <style> + body content.
const title = full.match(/<title>([^<]*)<\/title>/)[1];
const style = full.match(/<style>([\s\S]*?)<\/style>/)[1];
const bodyInner = full.match(/<body>([\s\S]*)<\/body>/)[1];

const preview = `<title>${title}</title>
<style>${style}</style>
${bodyInner}`;

fs.writeFileSync("/tmp/preview-dashboard.html", preview);
console.log("Preview written:", preview.length, "chars");
