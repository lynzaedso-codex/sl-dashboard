# SL Dashboard

Cloudflare Worker đọc **chỉ đọc** (read-only) dữ liệu từ 1 Lark Base, tổng hợp
thành 1 trang dashboard 5 tab, cập nhật theo yêu cầu qua lệnh `/pp` trong 1
nhóm Telegram cụ thể. Không có thao tác ghi nào vào Lark. Không dùng Shopify.

## 5 tab

1. **Cancel/Refund** — bảng `CC&RF` + `TTS CC.RF.RS`
2. **Channel Performance** — bảng `Report Performance` (sức khoẻ account Amazon)
3. **FBA Issues** — bảng `FBA - SUP duty`
4. **PayPal Dispute** — bảng `PayPal`
5. **Orders theo kênh** — 9 bảng order (FF FBA, AMZ FBM BASE, Telani Orders, TWD11-12, shinewines, TTS Oassie, GMB, TTS Arvexo, TTS Axiara)

Toàn bộ table_id/field mapping nằm trong `src/config.js`.

## Kiến trúc

```
Telegram (gõ /pp trong nhóm đã allowlist)
        │  POST /telegram  (webhook, xác thực secret_token)
        ▼
Cloudflare Worker (src/index.js)
        │  gọi Lark Bitable API (chỉ GET)
        ▼
Workers KV  ←── HTML dashboard được build sẵn, lưu ở đây
        │
        ▼
GET /  →  trả HTML từ KV cho bất kỳ ai có link
```

`GET /run?token=...` cũng kích hoạt build lại thủ công (dùng để test không cần Telegram).

## Yêu cầu trước khi deploy

- Node.js + npm đã cài trên máy bạn.
- Tài khoản Cloudflare (free tier đủ dùng): https://dash.cloudflare.com/sign-up
- Lark self-built app đã tạo, có quyền `bitable:app:readonly`, đã share (chỉ đọc) vào đúng Base `NMzKbxBLqa71FzskfWmu8zwis5d`.
- Bot Telegram đã tạo qua @BotFather, đã add vào nhóm CS Dashboard.

## Bước 1 — Cài đặt

```bash
git clone <repo-url>
cd sl-dashboard
npm install
```

## Bước 2 — Đăng nhập Cloudflare

```bash
npx wrangler login
```

(Mở trình duyệt để xác thực — chạy trên máy bạn, không phải trên server người khác.)

## Bước 3 — Tạo KV namespace

```bash
npx wrangler kv namespace create DASHBOARD_KV
```

Copy `id` trả về, dán vào `wrangler.toml` thay cho `REPLACE_ME_KV_NAMESPACE_ID`.

## Bước 4 — Điền giá trị không bí mật vào `wrangler.toml`

- `LARK_APP_ID` — App ID của app Lark bạn đã tạo (không bí mật).
- `TELEGRAM_ALLOWED_CHAT_ID` — đã điền sẵn `-5343409122` (nhóm "CS Dashboard"). Đổi nếu dùng nhóm khác.

## Bước 5 — Set secret (chạy trên máy bạn — KHÔNG dán các giá trị này vào bất kỳ đâu ngoài lệnh dưới đây)

```bash
npx wrangler secret put LARK_APP_SECRET
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put WORKER_ADMIN_TOKEN
```

- `LARK_APP_SECRET` — App Secret của app Lark.
- `TELEGRAM_BOT_TOKEN` — token BotFather đưa.
- `TELEGRAM_WEBHOOK_SECRET` — tự nghĩ ra 1 chuỗi ngẫu nhiên dài (vd chạy `openssl rand -hex 24`), dùng để Telegram xác thực webhook.
- `WORKER_ADMIN_TOKEN` — tự nghĩ ra 1 chuỗi ngẫu nhiên khác, dùng để gọi `/run` thủ công.

Mỗi lệnh sẽ hỏi nhập giá trị (ẩn khi gõ) — dán vào rồi Enter.

## Bước 6 — Deploy

```bash
npx wrangler deploy
```

Output sẽ cho URL dạng `https://sl-dashboard.<subdomain>.workers.dev`.

## Bước 7 — Test build thủ công (chưa cần Telegram)

```bash
curl "https://sl-dashboard.<subdomain>.workers.dev/run?token=<WORKER_ADMIN_TOKEN>"
```

Nếu trả `{"ok":true,...}` thì mở luôn URL gốc (`/`) để xem dashboard.

## Bước 8 — Gắn webhook Telegram

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://sl-dashboard.<subdomain>.workers.dev/telegram\", \"secret_token\": \"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

Thay đúng `<TELEGRAM_BOT_TOKEN>` và `<TELEGRAM_WEBHOOK_SECRET>` bạn đã set ở Bước 5.

## Bước 9 — Test thật

Vào nhóm Telegram "CS Dashboard", gõ:

```
/pp
```

Bot sẽ trả lời "⏳ Đang cập nhật..." rồi vài chục giây sau trả link dashboard đã cập nhật.

## Chạy test không cần token (local)

```bash
npm test
```

Test này build dashboard bằng dữ liệu giả, xác nhận toàn bộ analyzer + template không lỗi cú pháp — không gọi Lark/Telegram/Cloudflare thật.

## Bảo mật (không được nới lỏng)

- App Lark chỉ có quyền đọc Bitable (`bitable:app:readonly`), chỉ share vào đúng 1 Base.
- Toàn bộ gọi Lark trong code này là GET — không có endpoint ghi nào.
- `/telegram` chỉ xử lý request có đúng header `X-Telegram-Bot-Api-Secret-Token`.
- `/telegram` chỉ xử lý tin nhắn từ đúng `TELEGRAM_ALLOWED_CHAT_ID`.
- `/run` chỉ chạy khi có đúng `WORKER_ADMIN_TOKEN`.
- Không secret nào được hard-code trong code hay commit vào git — tất cả set bằng `wrangler secret put`.
