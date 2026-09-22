# CS Team Dashboard

Đọc **chỉ đọc** (read-only) dữ liệu từ 1 Lark Base, tổng hợp thành 1 trang
dashboard 6 tab, cập nhật theo yêu cầu qua lệnh `/new` trong 1 nhóm Telegram
cụ thể. Không có thao tác ghi nào vào Lark. Không dùng Shopify.

## 6 tab

0. **Tổng quan** — 1 thẻ trạng thái (🟢/🟡/🔴) mỗi mảng, so tuần Thứ6→Thứ5 vừa kết thúc trọn vẹn với tuần trước đó
1. **Cancel/Refund** — bảng `CC&RF` + `TTS CC.RF.RS`, lọc theo ngày/tuần/tháng/quý/tuỳ chọn + kênh/store, bấm dòng breakdown để drill-down
2. **Channel Performance** — bảng `Report Performance` (4 nhóm cột ETSY/AMZ/TIKTOK/WEBSITE trong cùng 1 bảng) — xem [Channel Performance](#channel-performance) bên dưới, tab này phức tạp hơn hẳn các tab khác
3. **FBA Issues** — bảng `FBA - SUP duty`
4. **PayPal Dispute** — bảng `PayPal`
5. **Orders theo kênh** — 9 bảng order (FF FBA, AMZ FBM BASE, Telani Orders, TWD11-12, shinewines, TTS Oassie, GMB, TTS Arvexo, TTS Axiara)

Toàn bộ table_id/field mapping nằm trong `src/config.js`.

## Channel Performance

Đánh giá đạt/không đạt target theo tuần (không tính điểm quy đổi) cho từng
account, theo đúng 4 bộ target đã chốt trong `CHANNEL_PERF_TARGETS`
(`src/config.js`) — pass/fail/cận ngưỡng thuần theo threshold, không dùng
công thức quy đổi điểm của file Quality Criteria gốc. 2 cách xem: **Theo
kênh** và **Theo Supporter** (dùng `CS_MAP` trong `config.js`, lấy từ sheet
"Assign acc" — là snapshot cố định, sửa tay trong code khi có đổi phân công,
không có bảng Lark nào giữ mapping này).

**Đã làm thật, chạy được ngay:**
- Đọc toàn bộ lịch sử tuần từ `Report Performance` (mỗi dòng = 1 account/1
  tuần), so target, tính delta/cảnh báo cận ngưỡng/sparkline theo tuần.
- Bộ lọc tuần dạng lịch nhỏ, chỉ bấm được đúng ngày có báo cáo.
- View Theo kênh (ring + bảng account, bấm chỉ số để lọc) và Theo Supporter
  (so sánh xu hướng nhiều đường, bảng account theo từng supporter).
- **Issue rate theo kênh** (`src/analyze/channelWorkload.js`) — Cancel/Refund
  + PayPal Dispute ÷ số đơn xử lý, gộp theo ETSY/AMZ/TIKTOK/WEBSITE (không
  xuống được theo account/supporter — `Store` trong 9 bảng order và `Account`
  trong `Report Performance` không cùng cách đặt tên, không có khoá nối tin
  cậy). FBA Issues bị loại khỏi phần này theo yêu cầu — bảng đó không có cột
  account/store và không phải chỉ số do CS gây ra.
- **Review recovery theo Supporter** (`src/analyze/reviews.js`) — đọc 3 bảng
  `AMZ Review-FB-Voice` / `Etsy Review 2026` / `Tiktok Review` (table ID đã
  chốt trong `REVIEW_TABLES`), đếm review 1-2★ + tỉ lệ đã xử lý (field
  `Resolve`) theo từng supporter, chỉ tính được cho Etsy/TikTok (AMZ không có
  bước xử lý theo chính sách Amazon).

**Chưa làm — cần thêm input:**
- **Ticket Zendesk theo supporter** — cần bạn set 3 secret
  `ZENDESK_SUBDOMAIN` / `ZENDESK_EMAIL` / `ZENDESK_API_TOKEN` vào GitHub
  Actions Secrets (xem hướng dẫn trong lịch sử chat), và code parse chữ ký
  trong nội dung reply (`Chữ+DDMMYY`) — chưa xử lý case reply >1 lần/ngày
  (chưa có mẫu thật để biết định dạng).
- TikTok's "60-Day After-Sales Handling Time" — giá trị thô lấy được nhỏ bất
  thường so target giờ (26.5h), **cần đối chiếu 1 dòng dữ liệu thật** trước
  khi tin tưởng cột này pass/fail đúng.

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
bất kỳ ai mở link, (2) khi có `/new` hoặc gọi `/run`, gọi API
`repository_dispatch` của GitHub để **kích hoạt Action chạy ngay** (không
phải lịch tự động — chỉ chạy khi có người yêu cầu).

```
Telegram (gõ /new)                 GitHub Actions (refresh-dashboard.yml)
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
mỗi lần bấm nút/`/new` là đúng 1 lần Action chạy trọn vẹn từ đầu đến cuối.

**Cách kích hoạt refresh — có 2 cách:**

1. **Nút "🔄 Cập nhật dữ liệu mới" ngay trên trang dashboard** — ai mở link
   cũng bấm được, không cần token/Telegram gì cả. Đây là cách chính, dùng
   được cho cả nhóm. Có cooldown 60 giây phía server (lưu trong KV) để
   tránh nhiều người bấm liên tục tạo quá nhiều lượt chạy Action.
2. **Gõ `/new` trong nhóm Telegram** — **hiện KHÔNG dùng được** nếu Worker
   vẫn đang ở domain `*.workers.dev` miễn phí: Telegram báo lỗi
   `Failed to resolve host` khi gắn webhook vào domain này (đã kiểm chứng
   không phải do lỗi Telegram toàn cục — thử gắn webhook vào
   `https://www.google.com` thì thành công ngay). Chỉ khắc phục được nếu
   gắn 1 custom domain riêng (~10-15$/năm) cho Worker. Nút refresh ở trên
   là cách thay thế không cần domain riêng, nên coi Telegram là tuỳ chọn
   phụ, không phải đường chính nữa.

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
/new
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
