# CS Team Dashboard

Đọc **chỉ đọc** (read-only) dữ liệu từ 1 Lark Base, tổng hợp thành 1 trang
dashboard 6 tab, cập nhật theo yêu cầu qua lệnh `/pp` trong 1 nhóm Telegram
cụ thể. Không có thao tác ghi nào vào Lark. Không dùng Shopify.

## 6 tab

0. **Tổng quan** — 1 thẻ trạng thái (🟢/🟡/🔴) mỗi mảng, so tuần Thứ6→Thứ5 vừa kết thúc trọn vẹn với tuần trước đó
1. **Cancel/Refund** — bảng `CC&RF` + `TTS CC.RF.RS`, lọc theo ngày/tuần/tháng/quý/tuỳ chọn + kênh/store, bấm dòng breakdown để drill-down
2. **Channel Performance** — bảng `Report Performance` (sức khoẻ account Amazon)
3. **FBA Issues** — bảng `FBA - SUP duty`
4. **PayPal Dispute** — bảng `PayPal`
5. **Orders theo kênh** — 9 bảng order (FF FBA, AMZ FBM BASE, Telani Orders, TWD11-12, shinewines, TTS Oassie, GMB, TTS Arvexo, TTS Axiara)

Toàn bộ table_id/field mapping nằm trong `src/config.js`.

## Kiến trúc (2 phần riêng biệt)

**Lấy dữ liệu & build dashboard = GitHub Actions.** Lark Bitable có 14 bảng,
riêng `AMZ FBM BASE` ~8000 dòng — Cloudflare Workers (gói Free) giới hạn 50
lượt gọi mạng phụ mỗi lần chạy, không đủ tải hết trong 1 lần. Từng thử chia
nhỏ thành nhiều bước chạy nối tiếp qua Cloudflare Cron Trigger, nhưng
Cloudflare không đảm bảo cron chạy đúng lịch (best-effort, có lúc bị trễ/kẹt
không rõ lý do). **GitHub Actions runner không bị giới hạn kiểu đó** — chạy
trên máy ảo thật, gọi bao nhiêu request cũng được trong 1 lần, nên toàn bộ
14 bảng tải xong trong **1 lần chạy duy nhất**, không cần chia bước.

**Phục vụ trang & nhận lệnh Telegram = Cloudflare Worker.** Worker không gọi
Lark nữa — chỉ làm 2 việc: (1) trả HTML đã build sẵn từ Cloudflare KV cho
bất kỳ ai mở link, (2) khi có `/pp` hoặc gọi `/run`, gọi API
`repository_dispatch` của GitHub để **kích hoạt Action chạy ngay** (không
phải lịch tự động — chỉ chạy khi có người yêu cầu).

```
Telegram (gõ /pp)                 GitHub Actions (refresh-dashboard.yml)
     │ POST /telegram                    │
     ▼                                   │  scripts/build-and-publish.mjs:
Cloudflare Worker (src/index.js)         │  - gọi Lark, tải cả 14 bảng
     │ gọi API repository_dispatch ─────►│    (1 lần chạy, không giới hạn
     │ (kích hoạt Action chạy ngay)      │     subrequest kiểu Workers)
     │                                   │  - build HTML dashboard
     │                                   │  - ghi thẳng vào Cloudflare KV
     │                                   │    qua Cloudflare REST API
     │                                   │  - báo kết quả về Telegram
     ▼                                   ▼
GET /  ←── trả HTML từ KV ──────── Cloudflare KV (dashboard:html)
```

Không có cron, không có lịch tự động, không có state machine nhiều bước —
mỗi lần `/pp` là đúng 1 lần Action chạy trọn vẹn từ đầu đến cuối.

## Yêu cầu trước khi setup

- Node.js + npm đã cài trên máy bạn.
- Tài khoản Cloudflare (free tier đủ dùng): https://dash.cloudflare.com/sign-up
- Repo GitHub đã có (ví dụ `lynzaedso-codex/sl-dashboard`), đẩy toàn bộ code này lên đó.
- Lark self-built app đã tạo, có quyền `bitable:app:readonly`, đã share (chỉ đọc) vào đúng Base `NMzKbxBLqa71FzskfWmu8zwis5d`.
- Bot Telegram đã tạo qua @BotFather, đã add vào nhóm CS Dashboard.

## Bước 1 — Đẩy code lên GitHub

Giải nén, rồi từ trong thư mục đó:

```bash
git init
git add -A
git commit -m "Refresh-via-GitHub-Actions architecture"
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

(Nếu repo đã có sẵn code cũ, `git pull --rebase` trước hoặc dùng
`git push --force-with-lease` — hoặc đơn giản nhất: vào github.dev
(bấm phím `.` khi đang xem repo trên github.com) và kéo-thả toàn bộ file
vào, giống cách đã làm lần đầu.)

## Bước 2 — Tạo Cloudflare API Token (cho GitHub Actions ghi vào KV)

1. https://dash.cloudflare.com/profile/api-tokens → **Create Token**
2. Chọn template **"Edit Cloudflare Workers"**
3. Ở **Account Resources**, chọn đúng account của bạn
4. **Continue to summary** → **Create Token** → copy lại (chỉ hiện 1 lần)

## Bước 3 — Tạo GitHub Personal Access Token (cho Worker gọi được GitHub)

1. https://github.com/settings/tokens → **Generate new token (classic)**
2. Chọn scope **`repo`** (đủ quyền gọi `repository_dispatch`)
3. Generate → copy lại token

## Bước 4 — Lấy Account ID + KV Namespace ID

```bash
npx wrangler login
npx wrangler kv namespace create DASHBOARD_KV
```

Copy `id` trả về (đây là `CLOUDFLARE_KV_NAMESPACE_ID`). Account ID xem ở
Cloudflare Dashboard → góc phải trang Workers & Pages, hoặc trong URL
`dash.cloudflare.com/<account-id>/...`.

## Bước 5 — Lưu secrets vào GitHub repo

Vào repo trên GitHub → **Settings** → **Secrets and variables** → **Actions**
→ **New repository secret**, tạo lần lượt:

| Secret | Giá trị |
|---|---|
| `LARK_APP_ID` | App ID của app Lark (không bí mật nhưng cứ để chung cho gọn) |
| `LARK_APP_SECRET` | App Secret của app Lark |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID lấy ở Bước 4 |
| `CLOUDFLARE_API_TOKEN` | Token tạo ở Bước 2 |
| `CLOUDFLARE_KV_NAMESPACE_ID` | KV namespace id lấy ở Bước 4 |
| `TELEGRAM_BOT_TOKEN` | Token BotFather đưa (để Action tự báo kết quả về Telegram) |

## Bước 6 — Điền giá trị vào `wrangler.toml` rồi deploy Worker

Sửa 2 chỗ trong `wrangler.toml`:
- `GITHUB_REPO` → `"<owner>/<repo>"` (ví dụ `"lynzaedso-codex/sl-dashboard"`)
- `id` trong `[[kv_namespaces]]` → KV namespace id lấy ở Bước 4

```bash
npm install
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put WORKER_ADMIN_TOKEN
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

- `TELEGRAM_BOT_TOKEN` — giống giá trị đã lưu vào GitHub Secrets ở Bước 5.
- `TELEGRAM_WEBHOOK_SECRET` — tự nghĩ 1 chuỗi ngẫu nhiên (vd `openssl rand -hex 24`), dùng để Telegram xác thực webhook.
- `WORKER_ADMIN_TOKEN` — tự nghĩ 1 chuỗi ngẫu nhiên khác, dùng để gọi `/run` thủ công.
- `GITHUB_TOKEN` — token tạo ở Bước 3.

Output `wrangler deploy` cho URL dạng `https://sl-dashboard.<subdomain>.workers.dev`.

## Bước 7 — Test thủ công (chưa cần Telegram)

Cách 1 — qua Worker:
```bash
curl "https://sl-dashboard.<subdomain>.workers.dev/run?token=<WORKER_ADMIN_TOKEN>"
```

Cách 2 — trực tiếp trên GitHub (không cần Worker): vào tab **Actions** trên
GitHub repo → chọn workflow **Refresh dashboard** → **Run workflow**.

Cả 2 cách đều chạy đúng 1 lần, thường xong trong **1-2 phút** (không phải
12-15 phút như bản cron cũ). Theo dõi tiến độ ở tab **Actions** trên GitHub
(xem log trực tiếp), hoặc:

```bash
curl "https://sl-dashboard.<subdomain>.workers.dev/status?token=<WORKER_ADMIN_TOKEN>"
```

Khi `lastGenerated` có giá trị mới, mở URL gốc (`/`) để xem dashboard.

## Bước 8 — Gắn webhook Telegram

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://sl-dashboard.<subdomain>.workers.dev/telegram\", \"secret_token\": \"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

## Bước 9 — Test thật

Vào nhóm Telegram "CS Dashboard", gõ:

```
/pp
```

Bot trả lời "⏳ Đã yêu cầu cập nhật..." ngay lập tức, rồi khoảng 1-2 phút
sau (khi GitHub Actions chạy xong) tự nhắn kết quả kèm link.

## Chạy test không cần token (local)

```bash
npm test
```

Test này build dashboard bằng dữ liệu giả, xác nhận toàn bộ analyzer + template không lỗi cú pháp — không gọi Lark/Telegram/Cloudflare/GitHub thật.

## Bảo mật (không được nới lỏng)

- App Lark chỉ có quyền đọc Bitable (`bitable:app:readonly`), chỉ share vào đúng 1 Base.
- Toàn bộ gọi Lark trong code này là GET — không có endpoint ghi nào.
- `/telegram` chỉ xử lý request có đúng header `X-Telegram-Bot-Api-Secret-Token`.
- `/telegram` chỉ xử lý tin nhắn từ đúng `TELEGRAM_ALLOWED_CHAT_ID`.
- `/run` chỉ chạy khi có đúng `WORKER_ADMIN_TOKEN`.
- GitHub Personal Access Token chỉ cần scope `repo`, không cần quyền admin/org nào khác.
- Không secret nào được hard-code trong code hay commit vào git — Cloudflare secrets set bằng `wrangler secret put`, GitHub secrets set qua Settings → Secrets and variables → Actions.
