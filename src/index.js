import { KV_KEY, KV_KEY_DATA } from "./config.js";

const KV_KEY_LAST_REFRESH_TRIGGER = "dashboard:lastRefreshTriggerAt";
const REFRESH_COOLDOWN_MS = 60 * 1000; // matches the button's own 30s disable + margin

// This Worker no longer fetches Lark data itself — that work now runs as a
// single GitHub Actions job (see .github/workflows/refresh-dashboard.yml +
// scripts/build-and-publish.mjs), which has no Cloudflare-Workers-style
// subrequest cap, so it does the whole 14-table fetch in one shot and
// writes the result straight to this Worker's KV. This Worker's only jobs
// are: serve the cached HTML, and kick off that GitHub Actions run.

function checkToken(url, env) {
  const token = url.searchParams.get("token");
  return token && token === env.WORKER_ADMIN_TOKEN;
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

// Fires a GitHub Actions run via the repository_dispatch API. `clientPayload`
// (optional) is handed back to the workflow as `github.event.client_payload`
// — used to pass the Telegram chat/message id through so the Action itself
// can reply when it's done (the Worker has no way to know when a run it
// kicked off actually finishes).
async function triggerGithubRefresh(env, clientPayload) {
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "sl-dashboard-worker",
    },
    body: JSON.stringify({ event_type: "refresh-dashboard", client_payload: clientPayload || {} }),
  });
  if (resp.status !== 204) {
    const text = await resp.text();
    throw new Error(`GitHub dispatch failed: ${resp.status} ${text}`);
  }
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
        "Dashboard chưa được tạo lần nào. Gõ /new trong nhóm Telegram, hoặc gọi /run?token=... để bắt đầu tạo lần đầu.",
        { status: 503 }
      );
    }

    if (url.pathname === "/status" && request.method === "GET") {
      if (!checkToken(url, env)) return new Response("Unauthorized", { status: 401 });
      const data = await env.DASHBOARD_KV.get(KV_KEY_DATA);
      return new Response(JSON.stringify({ ok: true, lastGenerated: data ? JSON.parse(data) : null }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Manual trigger for testing — kicks off the same GitHub Actions run
    // `/new` in Telegram does, just without a chat to notify.
    if (url.pathname === "/run" && request.method === "GET") {
      if (!checkToken(url, env)) return new Response("Unauthorized", { status: 401 });
      try {
        await triggerGithubRefresh(env, {});
        return new Response(JSON.stringify({ ok: true, queued: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Public — anyone with the dashboard link can trigger a refresh from the
    // "🔄 Cập nhật dữ liệu mới" button on the page itself (no admin token).
    // A short server-side cooldown stops a page full of people from
    // spam-triggering GitHub Actions runs (each run is real Lark API + CI
    // usage, not free to spam even if it's free per-run).
    if (url.pathname === "/refresh" && request.method === "POST") {
      const lastRaw = await env.DASHBOARD_KV.get(KV_KEY_LAST_REFRESH_TRIGGER);
      const last = lastRaw ? Number(lastRaw) : 0;
      const now = Date.now();
      if (now - last < REFRESH_COOLDOWN_MS) {
        return new Response(
          JSON.stringify({ ok: false, error: "Vừa mới có người bấm cập nhật, đợi 1 phút rồi thử lại." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      try {
        await env.DASHBOARD_KV.put(KV_KEY_LAST_REFRESH_TRIGGER, String(now));
        await triggerGithubRefresh(env, {});
        return new Response(JSON.stringify({ ok: true, queued: true }), {
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

      if (!/^\/new\b/i.test(message.text.trim())) {
        return new Response("ok");
      }

      ctx.waitUntil(
        (async () => {
          try {
            await triggerGithubRefresh(env, { chat_id: chatId, message_id: message.message_id, origin: url.origin });
            await sendTelegramMessage(
              env,
              chatId,
              "⏳ Đã yêu cầu cập nhật dashboard (chạy qua GitHub Actions, không giới hạn số bảng, không cần chờ nhiều bước) — sẽ báo lại khi xong.",
              message.message_id
            );
          } catch (err) {
            await sendTelegramMessage(env, chatId, `❌ Không kích hoạt được cập nhật: ${err}`, message.message_id);
          }
        })()
      );

      return new Response("ok");
    }

    return new Response("Not found", { status: 404 });
  },
};
