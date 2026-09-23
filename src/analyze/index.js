import { LARK_APP_TOKEN, TABLES, ORDER_TABLES, REVIEW_TABLES } from "../config.js";
import { getTenantAccessToken, listAllRecords } from "../lark.js";
import { analyzeCancelRefund } from "./cancelRefund.js";
import { analyzeChannelPerformance } from "./channelPerformance.js";
import { analyzeChannelWorkload } from "./channelWorkload.js";
import { analyzeFbaIssues } from "./fbaIssues.js";
import { analyzePaypalDispute } from "./paypalDispute.js";
import { analyzeOrdersByChannel } from "./ordersByChannel.js";
import { analyzeReviewRecovery } from "./reviews.js";

// Fetches all 14 Lark tables in one go — called from GitHub Actions
// (scripts/build-and-publish.mjs), which has no per-invocation subrequest
// cap the way Cloudflare Workers does, so there's no need to split this
// across multiple runs. Every table is fetched in full, always — an
// earlier date-windowed version silently under-counted real data.
export async function fetchAll(env) {
  const token = await getTenantAccessToken(env);

  const corePromise = Promise.all([
    listAllRecords(token, LARK_APP_TOKEN, TABLES.cancelRefund.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.ttsCancelRefund.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.channelPerformance.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.fbaIssues.id),
    listAllRecords(token, LARK_APP_TOKEN, TABLES.paypalDispute.id),
  ]);

  // Review tables are a supplementary signal (review recovery), not core —
  // one of them (AMZ Review-FB-Voice, image-heavy) has timed out fetching in
  // practice. A persistent failure here degrades reviewRecovery to empty
  // rather than failing the whole refresh and leaving Cancel/Refund, Channel
  // Performance etc. stuck on stale data too.
  const reviewPromise = Promise.all([
    listAllRecords(token, LARK_APP_TOKEN, REVIEW_TABLES.amzReviewFbVoice.id),
    listAllRecords(token, LARK_APP_TOKEN, REVIEW_TABLES.etsyReview2026.id),
    listAllRecords(token, LARK_APP_TOKEN, REVIEW_TABLES.tiktokReview.id),
  ]).catch((err) => {
    console.error("Review tables fetch failed, continuing without review recovery data:", err);
    return [[], [], []];
  });

  const orderTablesPromise = Promise.all(
    ORDER_TABLES.map(async (table) => ({ table, rows: await listAllRecords(token, LARK_APP_TOKEN, table.id) }))
  );

  const [[ccrfRows, ttsCcrfRows, channelPerfRows, fbaIssueRows, paypalRows], [amzReviewRows, etsyReviewRows, tiktokReviewRows], orderTablesData] =
    await Promise.all([corePromise, reviewPromise, orderTablesPromise]);

  return {
    partA: { ccrfRows, ttsCcrfRows, channelPerfRows, fbaIssueRows, paypalRows, amzReviewRows, etsyReviewRows, tiktokReviewRows },
    orderTablesData,
  };
}

export function combineAndAnalyze(partA, orderTablesData) {
  const cancelRefund = analyzeCancelRefund(partA.ccrfRows, partA.ttsCcrfRows);
  const paypalDispute = analyzePaypalDispute(partA.paypalRows);
  return {
    cancelRefund,
    channelPerformance: analyzeChannelPerformance(partA.channelPerfRows),
    channelWorkload: analyzeChannelWorkload(cancelRefund.cases, paypalDispute.cases, orderTablesData),
    reviewRecovery: analyzeReviewRecovery(partA.amzReviewRows, partA.etsyReviewRows, partA.tiktokReviewRows),
    fbaIssues: analyzeFbaIssues(partA.fbaIssueRows),
    paypalDispute,
    ordersByChannel: analyzeOrdersByChannel(orderTablesData),
    generatedAt: Date.now(),
  };
}
