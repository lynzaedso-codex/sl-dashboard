// Runs every analyzer + the template renderer against fake data — no Lark/
// Telegram/Cloudflare token needed. Run with: node test/local-smoke-test.mjs
import { analyzeCancelRefund } from "../src/analyze/cancelRefund.js";
import { analyzeChannelPerformance } from "../src/analyze/channelPerformance.js";
import { analyzeFbaIssues } from "../src/analyze/fbaIssues.js";
import { analyzePaypalDispute } from "../src/analyze/paypalDispute.js";
import { analyzeOrdersByChannel } from "../src/analyze/ordersByChannel.js";
import { ORDER_TABLES } from "../src/config.js";
import { renderDashboard } from "../src/dashboard-template.js";

const ccrfRows = [
  { "Case status": "Refund", Channel: ["ETSY"], Date: Date.now() - 86400000 * 5, "Details Problem": "khách muốn cc", Store: "FLW", Product: ["Ornament"], Person: [{ name: "Heny_CS" }], "Rf amount": "10.5" },
  { "Case status": "Cancel", Channel: ["ETSY"], Date: Date.now() - 86400000 * 40, "Details Problem": "đổi ý", Store: "FLW", Product: ["Mug"], Person: [{ name: "Heny_CS" }], "Rf amount": "0" },
];
const ttsRows = [{ Type: "Cancel", Reason: "Buyer request cancel", "Seller cancel amount": "12", Store: ["TTS TWD"], Supplier: "Buyer request cancel" }];

const perfRows = [
  { Account: "AMZ-FLW", Channel: "AMZ", "Date Report": Date.now() - 86400000 * 10, "Seller ODR <0.5%": "0.008", "Late shipment rate": "0.02", "Valid tracking rate": "0.99", "On-time delivery rate": "0.98", "A-Z claims": "0", "Chargback claims": "0", "Negative feeback": "0", "Review rate (AMZ)": "4.7" },
];

const fbaRows = [
  { "Date issue": Date.now() - 86400000 * 3, "SUPPLIER sx hàng": "Jack", "FF place gốc": "kho EMD", "PRODUCT TYPE": "Grommet flag", ISSUE: "thiếu grommet", CS: [{ name: "Nguyet_CS" }], "Resend place": "kho EMD" },
];

const paypalRows = [
  { "Case ID": "PP-1", "Case Reason": "Unauthorized transaction", "Case Status": "Reviewing", "Case Type": "Chargeback", Channel: "PayPal", "Date Dispute": Date.now() - 86400000 * 20, "Due date": Date.now() - 86400000 * 2, Status: "Delivered", Store: "FLW", Supplier: "Jack", Update: "contact mail khách no reply" },
];

const orderTablesData = ORDER_TABLES.map((table) => ({
  table,
  rows: [{ [table.fields.orderNumber]: "TEST-1", [table.fields.date]: Date.now() - 86400000 * 7, [table.fields.qty]: "1", ...(table.fields.fee ? { [table.fields.fee]: "10" } : {}), ...(table.fields.cogs ? { [table.fields.cogs]: "3" } : {}), ...(table.fields.store ? { [table.fields.store]: "TESTSTORE" } : {}) }],
}));

const data = {
  cancelRefund: analyzeCancelRefund(ccrfRows, ttsRows),
  channelPerformance: analyzeChannelPerformance(perfRows),
  fbaIssues: analyzeFbaIssues(fbaRows),
  paypalDispute: analyzePaypalDispute(paypalRows),
  ordersByChannel: analyzeOrdersByChannel(orderTablesData),
  generatedAt: Date.now(),
};

const html = renderDashboard(data);

console.assert(html.includes("SL Dashboard"), "title missing");
console.assert(html.includes("Cancel/Refund"), "tab missing");
console.assert(html.length > 5000, "output looks too short");

console.log("OK — smoke test passed. Rendered HTML length:", html.length);
