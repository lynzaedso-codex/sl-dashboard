import { runPipeline } from "./analyze/index.js";
import { renderDashboard } from "./dashboard-template.js";
import { KV_KEY, KV_KEY_DATA } from "./config.js";

async function rebuildDashboard(env) {
  const data = await runPipeline(env);
  const html = renderDashboard(data);
  await env.DASHBOARD_KV.put(KV_KEY, html);
  await env.DASHBOARD_KV.put(KV_KEY_DATA, JSON.stringify({ generatedAt: data.generatedAt }));
  return data;
}

async function sendTelegramMessage(env, chatId, text, replyToMessageId) {
  const body = { chat_id: chatId, text };
  if (replyToMessageId) body.reply_to_message_id = replyToMessageId;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200 });
    }

    if (url.pathname === "/" && request.method === "GET") {
      const cached = await env.DASHBOARD_KV.get(KV_KEY);
      if (cached) {
        return new Response(cached, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
      }
      return new Response(
        "Dashboard chưa được tạo lần nào. Gõ /pp trong nhóm Telegram, hoặc gọi /run?token=... để tạo lần đầu.",
        { status: 503 }
      );
    }

    if (url.pathname === "/run" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token || token !== env.WORKER_ADMIN_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }
      try {
        const data = await rebuildDashboard(env);
        return new Response(JSON.stringify({ ok: true, generatedAt: data.generatedAt }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/telegram" && request.method === "POST") {
      const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("Forbidden", { status: 403 });
      }

      const update = await request.json();
      const message = update.message;
      if (!message || !message.text) return new Response("ok");

      const chatId = String(message.chat.id);
      if (chatId !== env.TELEGRAM_ALLOWED_CHAT_ID) {
        return new Response("ok"); // silently ignore chats outside the allowlist
      }

      if (!/^\/pp\b/i.test(message.text.trim())) {
        return new Response("ok");
      }

      // Ack immediately, run the (slow) pipeline in the background via waitUntil.
      ctx.waitUntil(
        (async () => {
          try {
            await sendTelegramMessage(env, chatId, "⏳ Đang cập nhật dashboard, chờ khoảng 30-60s...", message.message_id);
            const data = await rebuildDashboard(env);
            const workerUrl = `https://${url.hostname}/`;
            await sendTelegramMessage(
              env,
              chatId,
              `✅ Dashboard đã cập nhật (${new Date(data.generatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })})\n${workerUrl}`,
              message.message_id
            );
          } catch (err) {
            await sendTelegramMessage(env, chatId, `❌ Lỗi khi cập nhật dashboard: ${err}`, message.message_id);
          }
        })()
      );

      return new Response("ok");
    }

    return new Response("Not found", { status: 404 });
  },
};
