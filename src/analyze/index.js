import { LARK_APP_TOKEN, TABLES, ORDER_TABLES } from "../config.js";
import { getTenantAccessToken, listAllRecords } from "../lark.js";
import { analyzeCancelRefund } from "./cancelRefund.js";
import { analyzeChannelPerformance } from "./channelPerformance.js";
import { analyzeFbaIssues } from "./fbaIssues.js";
import { analyzePaypalDispute } from "./paypalDispute.js";
import { analyzeOrdersByChannel } from "./ordersByChannel.js";

// Fetches all 14 Lark tables in one go — called from GitHub Actions
// (scripts/build-and-publish.mjs), which has no per-invocation subrequest
// cap the way Cloudflare Workers does, so there's no need to split this
// across multiple runs. Every table is fetched in full, always — an
// earlier date-windowed version silently under-counted real data.
export async function fetchAll(env) {
  const token = await getTenantAccessToken(env);

  const [ccrfRows, ttsCcrfRows, channelPerfRows, fbaIssueRows, paypalRows] = await Promise.all([
    listAllRecords(token, LARK_APP_TOKEN, TABLES.cancelRefund.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.ttsCancelRefund.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.channelPerformance.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.fbaIssues.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.paypalDispute.id),
  ]);

  const orderTablesData = await Promise.all(
    ORDER_TABLES.map(async (table) => ({ table, rows: await listAllRecords(token, LARK_APP_TOKEN, table.id) }))
  );

  return {
    partA: { ccrfRows, ttsCcrfRows, channelPerfRows, fbaIssueRows, paypalRows },
    orderTablesData,
  };
}

export function combineAndAnalyze(partA, orderTablesData) {
  return {
    cancelRefund: analyzeCancelRefund(partA.ccrfRows, partA.ttsCcrfRows),
    channelPerformance: analyzeChannelPerformance(partA.channelPerfRows),
    fbaIssues: analyzeFbaIssues(partA.fbaIssueRows),
    paypalDispute: analyzePaypalDispute(partA.paypalRows),
    ordersByChannel: analyzeOrdersByChannel(orderTablesData),
    generatedAt: Date.now(),
  };
}
