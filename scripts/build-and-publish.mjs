// Runs inside GitHub Actions (see ../.github/workflows/refresh-dashboard.yml).
// Unlike the Cloudflare Worker, a GitHub Actions runner has no per-invocation
// subrequest cap — so this fetches all 14 Lark tables in ONE run, builds the
// dashboard, and pushes it straight into the Worker's Cloudflare KV
// namespace via the Cloudflare REST API. No chaining, no cron, no state
// machine needed.
import { fetchAll, combineAndAnalyze } from "../src/analyze/index.js";
import { renderDashboard } from "../src/dashboard-template.js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Cloudflare KV REST API — same free-tier surface the Worker itself binds
// to, just called directly here instead of via a `wrangler.toml` binding.
async function putKv(env, key, value) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: value,
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(`Cloudflare KV put failed for key ${key}: ${JSON.stringify(data.errors)}`);
  }
}

async function sendTelegramMessage(env, chatId, text, replyToMessageId) {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId) return;
  const body = { chat_id: chatId, text };
  if (replyToMessageId) body.reply_to_message_id = Number(replyToMessageId);
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function main() {
  const env = {
    LARK_APP_ID: requireEnv("LARK_APP_ID"),
    LARK_APP_SECRET: requireEnv("LARK_APP_SECRET"),
    CLOUDFLARE_ACCOUNT_ID: requireEnv("CLOUDFLARE_ACCOUNT_ID"),
    CLOUDFLARE_API_TOKEN: requireEnv("CLOUDFLARE_API_TOKEN"),
    CLOUDFLARE_KV_NAMESPACE_ID: requireEnv("CLOUDFLARE_KV_NAMESPACE_ID"),
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  };
  // Passed through from the /telegram webhook via repository_dispatch's
  // client_payload — absent when triggered manually via /run.
  const chatId = process.env.CLIENT_CHAT_ID || "";
  const messageId = process.env.CLIENT_MESSAGE_ID || "";
  const origin = process.env.CLIENT_ORIGIN || "";

  try {
    const larkEnv = { LARK_APP_ID: env.LARK_APP_ID, LARK_APP_SECRET: env.LARK_APP_SECRET };
    console.log("Fetching all 14 Lark tables...");
    const { partA, orderTablesData } = await fetchAll(larkEnv);
    const data = combineAndAnalyze(partA, orderTablesData);
    const html = renderDashboard(data);

    console.log("Publishing to Cloudflare KV...");
    await putKv(env, "dashboard:html", html);
    await putKv(env, "dashboard:data", JSON.stringify({ generatedAt: data.generatedAt }));

    console.log("Done. generatedAt =", new Date(data.generatedAt).toISOString());
    await sendTelegramMessage(
      env,
      chatId,
      `✅ Dashboard đã cập nhật (${new Date(data.generatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })})\n${origin}/`,
      messageId
    );
  } catch (err) {
    console.error(err);
    await sendTelegramMessage(env, chatId, `❌ Lỗi khi cập nhật dashboard: ${err}`, messageId);
    process.exit(1);
  }
}

main();
