import { LARK_APP_TOKEN, TABLES, ORDER_TABLES } from "../config.js";
import { getTenantAccessToken, listAllRecords } from "../lark.js";
import { analyzeCancelRefund } from "./cancelRefund.js";
import { analyzeChannelPerformance } from "./channelPerformance.js";
import { analyzeFbaIssues } from "./fbaIssues.js";
import { analyzePaypalDispute } from "./paypalDispute.js";
import { analyzeOrdersByChannel } from "./ordersByChannel.js";

export async function runPipeline(env) {
  const token = await getTenantAccessToken(env);

  const [ccrfRows, ttsCcrfRows, channelPerfRows, fbaIssueRows, paypalRows] = await Promise.all([
    listAllRecords(token, LARK_APP_TOKEN, TABLES.cancelRefund.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.ttsCancelRefund.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.channelPerformance.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.fbaIssues.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.paypalDispute.id),
  ]);

  const orderTablesData = await Promise.all(
    ORDER_TABLES.map(async (table) => ({
      table,
      rows: await listAllRecords(token, LARK_APP_TOKEN, table.id),
    }))
  );

  return {
    cancelRefund: analyzeCancelRefund(ccrfRows, ttsCcrfRows),
    channelPerformance: analyzeChannelPerformance(channelPerfRows),
    fbaIssues: analyzeFbaIssues(fbaIssueRows),
    paypalDispute: analyzePaypalDispute(paypalRows),
    ordersByChannel: analyzeOrdersByChannel(orderTablesData),
    generatedAt: Date.now(),
  };
}
