// Renders the full dashboard page as a single HTML string. All chart drawing
// happens in the viewer's browser (inline <script> below) — the Worker only
// ever serves this string from KV, it doesn't run a headless browser itself.
import { CHANNEL_PERF_TARGETS, CS_MAP } from "./config.js";

export function renderDashboard(data) {
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
  const targetsJson = JSON.stringify(CHANNEL_PERF_TARGETS).replace(/</g, "\\u003c");
  const csMapJson = JSON.stringify(CS_MAP).replace(/</g, "\\u003c");
  const updated = new Date(data.generatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CS Team Dashboard</title>
<style>${STYLE}</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand">CS Team Dashboard</div>
    <div class="topbar-right">
      <span class="updated" id="updatedAt">Cập nhật: ${updated}</span>
      <button id="refreshBtn" class="btn-ghost" title="Lấy dữ liệu mới nhất từ Lark, build lại dashboard (mất khoảng 1-2 phút)">🔄 Cập nhật dữ liệu mới</button>
      <button id="themeToggle" class="btn-ghost" title="Đổi giao diện sáng/tối">🌓</button>
    </div>
  </header>

  <nav class="tabs" id="tabs">
    <button class="tab active" data-tab="overview">Tổng quan</button>
    <button class="tab" data-tab="cancelRefund">Cancel/Refund</button>
    <button class="tab" data-tab="channelPerformance">Channel Performance</button>
    <button class="tab" data-tab="fbaIssues">FBA Issues</button>
    <button class="tab" data-tab="paypalDispute">PayPal Dispute</button>
    <button class="tab" data-tab="ordersByChannel">Orders theo kênh</button>
  </nav>

  <main id="panels">
    <section class="panel active" id="panel-overview"></section>
    <section class="panel" id="panel-cancelRefund"></section>
    <section class="panel" id="panel-channelPerformance"></section>
    <section class="panel" id="panel-fbaIssues"></section>
    <section class="panel" id="panel-paypalDispute"></section>
    <section class="panel" id="panel-ordersByChannel"></section>
  </main>
</div>

<script>
window.__DATA__ = ${dataJson};
window.__CHANNEL_TARGETS__ = ${targetsJson};
window.__CS_MAP__ = ${csMapJson};
${SCRIPT}
</script>
</body>
</html>`;
}

const STYLE = `
:root {
  color-scheme: light;
  --page: #f9f9f7;
  --surface: #fcfcfb;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --text-muted: #898781;
  --grid: #e1e0d9;
  --baseline: #c3c2b7;
  --border: rgba(11,11,11,0.10);
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --series-3: #1baf7a;
  --series-4: #eda100;
  --good: #0ca30c;
  --warning: #fab219;
  --critical: #d03b3b;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #0d0d0d;
    --surface: #1a1a19;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #898781;
    --grid: #2c2c2a;
    --baseline: #383835;
    --border: rgba(255,255,255,0.10);
    --series-1: #3987e5;
    --series-2: #d95926;
    --series-3: #199e70;
    --series-4: #c98500;
    --good: #0ca30c;
    --warning: #fab219;
    --critical: #e66767;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --page: #0d0d0d;
  --surface: #1a1a19;
  --text-primary: #ffffff;
  --text-secondary: #c3c2b7;
  --text-muted: #898781;
  --grid: #2c2c2a;
  --baseline: #383835;
  --border: rgba(255,255,255,0.10);
  --series-1: #3987e5;
  --series-2: #d95926;
  --series-3: #199e70;
  --series-4: #c98500;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--text-primary);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.app { max-width: 1180px; margin: 0 auto; padding: 0 16px 48px; }
.topbar { display: flex; align-items: center; justify-content: space-between;
  padding: 20px 0 12px; flex-wrap: wrap; gap: 8px; }
.brand { font-size: 20px; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.updated { font-size: 13px; color: var(--text-muted); }
.btn-ghost { background: transparent; border: 1px solid var(--border); border-radius: 8px;
  padding: 6px 10px; cursor: pointer; font-size: 15px; color: var(--text-primary); }
.tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--border);
  padding-bottom: 0; margin-bottom: 20px; }
.tab { background: transparent; border: none; padding: 10px 14px; font-size: 14px;
  color: var(--text-secondary); cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; }
.tab.active { color: var(--text-primary); border-bottom-color: var(--series-1); font-weight: 600; }
.panel { display: none; }
.panel.active { display: block; }
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
.kpi-tile { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
.kpi-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.kpi-value { font-size: 24px; font-weight: 700; }
.kpi-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 800px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 16px; margin-bottom: 16px; }
.card h3 { margin: 0 0 12px; font-size: 14px; color: var(--text-secondary); font-weight: 600; }
.legend { display: flex; gap: 14px; margin-bottom: 8px; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.bar-list-row { display: grid; grid-template-columns: 120px 1fr 60px; align-items: center;
  gap: 8px; font-size: 13px; margin-bottom: 8px; }
.bar-list-label { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-list-track { background: var(--grid); border-radius: 4px; height: 10px; overflow: hidden; }
.bar-list-fill { background: var(--series-1); height: 100%; border-radius: 4px; }
.bar-list-value { text-align: right; color: var(--text-primary); font-variant-numeric: tabular-nums; }
table.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
table.data-table th { text-align: left; color: var(--text-muted); font-weight: 600;
  padding: 6px 8px; border-bottom: 1px solid var(--grid); }
table.data-table td { padding: 6px 8px; border-bottom: 1px solid var(--grid); font-variant-numeric: tabular-nums; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.badge-critical { background: color-mix(in srgb, var(--critical) 15%, transparent); color: var(--critical); }
.badge-warning { background: color-mix(in srgb, var(--warning) 20%, transparent); color: var(--text-primary); }
.badge-good { background: color-mix(in srgb, var(--good) 15%, transparent); color: var(--good); }
.chart-wrap { position: relative; }
.chart-tooltip { position: absolute; pointer-events: none; background: var(--text-primary); color: var(--page);
  font-size: 11px; padding: 4px 8px; border-radius: 6px; opacity: 0; transform: translate(-50%, -110%);
  white-space: nowrap; transition: opacity 0.1s; z-index: 5; }
.empty-note { color: var(--text-muted); font-size: 13px; padding: 20px 0; text-align: center; }
.filter-bar { margin-bottom: 16px; }
.filter-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
.filter-btn { background: var(--page); border: 1px solid var(--border); border-radius: 8px;
  padding: 6px 12px; font-size: 13px; cursor: pointer; color: var(--text-secondary); }
.filter-btn.active { background: var(--series-1); border-color: var(--series-1); color: #fff; font-weight: 600; }
.filter-input { background: var(--page); border: 1px solid var(--border); border-radius: 8px;
  padding: 5px 8px; font-size: 13px; color: var(--text-primary); }
table.data-table tbody tr.row-clickable { cursor: pointer; }
table.data-table tbody tr.row-clickable:hover td { background: color-mix(in srgb, var(--series-1) 8%, transparent); }
table.data-table tbody tr.row-active td { background: color-mix(in srgb, var(--series-1) 22%, transparent); color: var(--text-primary); font-weight: 700; }
table.data-table tbody tr.row-active td:first-child { box-shadow: inset 3px 0 0 var(--series-1); }
.filter-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--series-1); color: #fff;
  border-radius: 999px; padding: 4px 10px 4px 12px; font-size: 12px; font-weight: 600; }
.filter-chip button { background: none; border: none; color: #fff; cursor: pointer; font-size: 13px; line-height: 1; padding: 0; }
table.pivot-table th, table.pivot-table td { text-align: center; }
table.pivot-table .pivot-row-label { text-align: left; color: var(--text-secondary); white-space: nowrap; }
.status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
.status-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px;
  cursor: pointer; transition: border-color 0.15s; text-align: left; }
.status-card:hover { border-color: var(--series-1); }
.status-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.status-card-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.status-dot-good { background: var(--good); }
.status-dot-warning { background: var(--warning); }
.status-dot-critical { background: var(--critical); }
.status-value-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.status-value { font-size: 26px; font-weight: 700; }
.status-delta { font-size: 13px; font-weight: 600; }
.status-delta-up { color: var(--critical); }
.status-delta-down { color: var(--good); }
.status-delta-flat { color: var(--text-muted); }
.status-note { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
.exec-summary-note { font-size: 13px; color: var(--text-secondary); margin: -8px 0 20px; }

/* ---- Channel Performance tab ---- */
.cp-head-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.cp-view-toggle { display: inline-flex; background: var(--page); border: 1px solid var(--border); border-radius: 10px; padding: 3px; }
.cp-view-btn { border: none; background: transparent; padding: 6px 14px; font-size: 13px; border-radius: 8px; cursor: pointer; color: var(--text-secondary); font-weight: 600; }
.cp-view-btn.active { background: var(--surface); color: var(--text-primary); box-shadow: 0 1px 2px var(--border); }
.cp-week-picker { position: relative; margin-bottom: 18px; }
.cp-week-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px;
  font-size: 13px; cursor: pointer; color: var(--text-primary); font-weight: 600; }
.cp-week-pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); display: none; gap: 18px; flex-wrap: wrap; }
.cp-week-pop.open { display: flex; }
.cp-cal-month { min-width: 210px; }
.cp-cal-month-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; color: var(--text-secondary); }
.cp-cal-grid { display: grid; grid-template-columns: repeat(7, 26px); gap: 3px; }
.cp-cal-dow { font-size: 9px; color: var(--text-muted); text-align: center; }
.cp-cal-day { font-size: 11px; text-align: center; padding: 5px 0; border-radius: 6px; color: var(--text-muted); }
.cp-cal-day.report { cursor: pointer; background: var(--page); color: var(--text-primary); font-weight: 600; }
.cp-cal-day.report:hover { background: color-mix(in srgb, var(--series-1) 25%, var(--page)); }
.cp-cal-day.selected { background: var(--series-1); color: #fff; }
.cp-cal-note { font-size: 10.5px; color: var(--text-muted); margin-top: 10px; max-width: 440px; }
.cp-row-full { margin-bottom: 16px; }
.cp-card-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: 14px; margin-bottom: 16px; }
.cp-health-card { display: flex; align-items: center; gap: 20px; }
.cp-entity-card { cursor: pointer; transition: border-color .15s; border: 1px solid var(--border); }
.cp-entity-card:hover { border-color: var(--series-1); }
.cp-entity-card.active { border-color: var(--series-1); box-shadow: 0 0 0 1px var(--series-1); }
.cp-entity-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.cp-entity-name { font-size: 15px; font-weight: 700; }
.cp-entity-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.cp-entity-chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0 8px; }
.cp-entity-chip { font-size: 10px; background: var(--page); color: var(--text-secondary); padding: 2px 6px; border-radius: 999px; }
.cp-avatar { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: #fff; }
.cp-ring-wrap { position: relative; width: 74px; height: 74px; flex-shrink: 0; }
.cp-ring-wrap.sm { width: 56px; height: 56px; }
.cp-ring-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; }
.cp-ring-wrap.sm .cp-ring-pct { font-size: 12px; }
.cp-delta { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
.cp-delta-up { color: var(--critical); background: color-mix(in srgb, var(--critical) 16%, transparent); }
.cp-delta-down { color: var(--good); background: color-mix(in srgb, var(--good) 16%, transparent); }
.cp-delta-flat { color: var(--text-muted); background: color-mix(in srgb, var(--text-muted) 14%, transparent); }
.cp-metric-bar-row { display: grid; grid-template-columns: 90px 1fr 42px; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 6px; }
.cp-metric-bar-label { color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-metric-bar-track { background: var(--page); border-radius: 4px; height: 6px; overflow: hidden; }
.cp-metric-bar-fill { height: 100%; border-radius: 4px; }
.cp-metric-bar-value { text-align: right; font-variant-numeric: tabular-nums; color: var(--text-secondary); }
.cp-pass { color: var(--good); } .cp-warn { color: var(--warning); } .cp-fail { color: var(--critical); }
.cp-ring-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 10px; margin-bottom: 18px; }
.cp-ring-tile { background: var(--page); border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; border: 1px solid transparent; }
.cp-ring-tile:hover { border-color: var(--series-1); }
.cp-ring-tile.active { border-color: var(--series-1); background: color-mix(in srgb, var(--series-1) 10%, var(--page)); }
.cp-ring-tile-label { font-size: 11px; color: var(--text-secondary); margin-top: 8px; }
.cp-ring-tile-sub { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
.cp-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.cp-badge-pass { background: color-mix(in srgb, var(--good) 16%, transparent); color: var(--good); }
.cp-badge-warn { background: color-mix(in srgb, var(--warning) 20%, transparent); color: var(--warning); }
.cp-badge-fail { background: color-mix(in srgb, var(--critical) 16%, transparent); color: var(--critical); }
.cp-badge-na { background: var(--page); color: var(--text-muted); }
.cp-chan-tag { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 5px; color: #fff; }
.cp-detail-row td { background: var(--page); }
.cp-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 10px; padding: 4px 0; }
.cp-detail-tile { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; }
.cp-detail-tile-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
.cp-detail-tile-value-row { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
.cp-detail-tile-value { font-size: 14px; font-weight: 700; }
.cp-detail-tile-delta { font-size: 10px; font-weight: 700; }
.cp-watch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.cp-watch-card { background: var(--page); border-radius: 12px; padding: 12px 14px; cursor: pointer; border: 1px solid transparent; }
.cp-watch-card:hover { border-color: var(--critical); }
.cp-watch-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.cp-watch-count { width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--critical) 18%, transparent);
  color: var(--critical); font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cp-watch-name { font-weight: 700; font-size: 13px; }
.cp-watch-chan { font-size: 10px; color: var(--text-muted); }
.cp-watch-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.cp-watch-chip { font-size: 10.5px; background: color-mix(in srgb, var(--critical) 10%, transparent); color: var(--critical); padding: 2px 7px; border-radius: 999px; }
.cp-multiline-legend { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; font-size: 11px; color: var(--text-secondary); }
.cp-multiline-legend-item { display: flex; align-items: center; gap: 5px; }
.cp-multiline-legend-dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
.cp-detail-section { display: none; }
.cp-detail-section.open { display: block; }
.cp-view-panel { display: none; }
.cp-view-panel.active { display: block; }
`;

const SCRIPT = `
(function () {
  var DATA = window.__DATA__;
  var COLORS = [
    getVar('--series-1'), getVar('--series-2'), getVar('--series-3'), getVar('--series-4')
  ];
  function getVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  // ---- theme toggle ----
  var themeBtn = document.getElementById('themeToggle');
  var saved = null;
  try { saved = localStorage.getItem('sl-theme'); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  themeBtn.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('sl-theme', next); } catch (e) {}
    renderAll();
  });

  // ---- refresh button — anyone with the dashboard link can trigger a
  // rebuild (no token needed here; the actual Lark fetch + build happens in
  // GitHub Actions via POST /refresh, see src/index.js). Disabled for a bit
  // after clicking so one page full of people can't spam-trigger it.
  var refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', function () {
    refreshBtn.disabled = true;
    var original = refreshBtn.textContent;
    refreshBtn.textContent = '⏳ Đang yêu cầu...';
    fetch('/refresh', { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.ok) {
          refreshBtn.textContent = '✅ Đã yêu cầu — xong sau ~1-2 phút, tải lại trang sau đó';
        } else {
          refreshBtn.textContent = '❌ Lỗi: ' + (res.error || 'không rõ');
        }
      })
      .catch(function () { refreshBtn.textContent = '❌ Không kết nối được'; })
      .finally(function () {
        setTimeout(function () { refreshBtn.disabled = false; refreshBtn.textContent = original; }, 30000);
      });
  });

  // ---- tabs ----
  var tabs = document.querySelectorAll('.tab');
  function switchTab(name) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + name); });
  }
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
  });

  // ---- small DOM helpers ----
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function renderKpis(container, kpis) {
    var row = el('div', 'kpi-row');
    (kpis || []).forEach(function (k) {
      var tile = el('div', 'kpi-tile');
      tile.appendChild(el('div', 'kpi-label', k.label));
      tile.appendChild(el('div', 'kpi-value', String(k.value)));
      if (k.sub) tile.appendChild(el('div', 'kpi-sub', k.sub));
      row.appendChild(tile);
    });
    container.appendChild(row);
  }

  function renderBarList(container, title, items, valueKey) {
    var card = el('div', 'card');
    card.appendChild(el('h3', null, title));
    if (!items || !items.length) {
      card.appendChild(el('div', 'empty-note', 'Chưa có dữ liệu'));
      container.appendChild(card);
      return;
    }
    var max = Math.max.apply(null, items.map(function (i) { return i[valueKey] || 0; }));
    items.forEach(function (item) {
      var row = el('div', 'bar-list-row');
      row.appendChild(el('div', 'bar-list-label', item.key || item.reason || item.issue));
      var track = el('div', 'bar-list-track');
      var fill = el('div', 'bar-list-fill');
      fill.style.width = (max ? (item[valueKey] / max) * 100 : 0) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div', 'bar-list-value', String(item[valueKey])));
      card.appendChild(row);
    });
    container.appendChild(card);
  }

  function renderTable(container, title, columns, rows) {
    var card = el('div', 'card');
    card.appendChild(el('h3', null, title));
    if (!rows || !rows.length) {
      card.appendChild(el('div', 'empty-note', 'Không có mục nào'));
      container.appendChild(card);
      return;
    }
    var table = el('table', 'data-table');
    var thead = el('thead');
    var headRow = el('tr');
    columns.forEach(function (c) { headRow.appendChild(el('th', null, c.label)); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      columns.forEach(function (c) {
        tr.appendChild(el('td', null, c.render ? c.render(r) : String(r[c.key] ?? '')));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    container.appendChild(card);
  }

  // ---- SVG grouped bar chart: categories on x, up to 4 named series ----
  function renderGroupedBarChart(container, title, categories, seriesDefs) {
    var card = el('div', 'card');
    card.appendChild(el('h3', null, title));
    if (!categories.length) {
      card.appendChild(el('div', 'empty-note', 'Chưa có dữ liệu'));
      container.appendChild(card);
      return;
    }
    var legend = el('div', 'legend');
    seriesDefs.forEach(function (s, i) {
      var item = el('span', 'legend-item');
      var dot = el('span', 'legend-dot'); dot.style.background = COLORS[i % COLORS.length];
      item.appendChild(dot);
      item.appendChild(document.createTextNode(s.label));
      legend.appendChild(item);
    });
    if (seriesDefs.length > 1) card.appendChild(legend);

    var wrap = el('div', 'chart-wrap');
    var width = 640, height = 220, padL = 32, padB = 24, padT = 10, padR = 8;
    var innerW = width - padL - padR, innerH = height - padT - padB;
    var allValues = [];
    categories.forEach(function (_, ci) { seriesDefs.forEach(function (s) { allValues.push(s.data[ci] || 0); }); });
    var maxVal = Math.max.apply(null, allValues.concat([1]));
    var groupW = innerW / categories.length;
    var barW = Math.min(24, (groupW * 0.7) / seriesDefs.length);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');
    svg.style.overflow = 'visible';

    // gridlines
    for (var g = 0; g <= 4; g++) {
      var y = padT + innerH - (g / 4) * innerH;
      var line = document.createElementNS(svg.namespaceURI, 'line');
      line.setAttribute('x1', padL); line.setAttribute('x2', width - padR);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', getVar('--grid')); line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }

    var tooltip = el('div', 'chart-tooltip');

    categories.forEach(function (cat, ci) {
      var groupX = padL + ci * groupW + (groupW - barW * seriesDefs.length) / 2;
      seriesDefs.forEach(function (s, si) {
        var val = s.data[ci] || 0;
        var barH = maxVal ? (val / maxVal) * innerH : 0;
        var rect = document.createElementNS(svg.namespaceURI, 'rect');
        rect.setAttribute('x', groupX + si * barW);
        rect.setAttribute('y', padT + innerH - barH);
        rect.setAttribute('width', Math.max(barW - 2, 1));
        rect.setAttribute('height', barH);
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', COLORS[si % COLORS.length]);
        rect.addEventListener('mousemove', function (evt) {
          var rectBounds = wrap.getBoundingClientRect();
          tooltip.textContent = cat + ' · ' + s.label + ': ' + val;
          tooltip.style.left = (evt.clientX - rectBounds.left) + 'px';
          tooltip.style.top = (evt.clientY - rectBounds.top) + 'px';
          tooltip.style.opacity = '1';
        });
        rect.addEventListener('mouseleave', function () { tooltip.style.opacity = '0'; });
        svg.appendChild(rect);
      });
      var label = document.createElementNS(svg.namespaceURI, 'text');
      label.setAttribute('x', padL + ci * groupW + groupW / 2);
      label.setAttribute('y', height - 6);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', getVar('--text-muted'));
      label.textContent = cat;
      svg.appendChild(label);
    });

    wrap.appendChild(svg);
    wrap.appendChild(tooltip);
    card.appendChild(wrap);
    container.appendChild(card);
  }

  // ---- SVG line chart: single metric over time ----
  function renderLineChart(container, title, points) {
    var card = el('div', 'card');
    card.appendChild(el('h3', null, title));
    if (!points.length) {
      card.appendChild(el('div', 'empty-note', 'Chưa có dữ liệu'));
      container.appendChild(card);
      return;
    }
    var width = 300, height = 140, padL = 8, padR = 8, padT = 10, padB = 20;
    var innerW = width - padL - padR, innerH = height - padT - padB;
    var values = points.map(function (p) { return p.value; });
    var maxVal = Math.max.apply(null, values.concat([0.0001]));
    var minVal = Math.min.apply(null, values.concat([0]));
    var range = maxVal - minVal || 1;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');

    var stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    var coords = points.map(function (p, i) {
      var x = padL + i * stepX;
      var y = padT + innerH - ((p.value - minVal) / range) * innerH;
      return [x, y];
    });

    var path = document.createElementNS(svg.namespaceURI, 'path');
    var d = coords.map(function (c, i) { return (i === 0 ? 'M' : 'L') + c[0] + ' ' + c[1]; }).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', getVar('--series-1'));
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);

    coords.forEach(function (c) {
      var dot = document.createElementNS(svg.namespaceURI, 'circle');
      dot.setAttribute('cx', c[0]); dot.setAttribute('cy', c[1]); dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', getVar('--series-1'));
      svg.appendChild(dot);
    });

    var lastLabel = document.createElementNS(svg.namespaceURI, 'text');
    lastLabel.setAttribute('x', padL); lastLabel.setAttribute('y', height - 4);
    lastLabel.setAttribute('font-size', '9'); lastLabel.setAttribute('fill', getVar('--text-muted'));
    lastLabel.textContent = points[0].label + ' → ' + points[points.length - 1].label;
    svg.appendChild(lastLabel);

    card.appendChild(svg);
    container.appendChild(card);
  }

  // ---- donut ring (conic-gradient) — used by the Channel Performance tab ----
  function cpRing(pct, color, size, thickness) {
    size = size || 74; thickness = thickness || 8;
    var wrap = el('div', 'cp-ring-wrap' + (size < 70 ? ' sm' : ''));
    wrap.style.width = size + 'px'; wrap.style.height = size + 'px';
    var deg = Math.round(Math.max(0, Math.min(1, pct / 100)) * 360);
    var track = el('div');
    track.style.cssText = 'position:absolute;inset:0;border-radius:50%;background:conic-gradient(' + color + ' ' + deg + 'deg, var(--page) 0deg);';
    var hole = el('div');
    var t = Math.round(size * (thickness / 74));
    hole.style.cssText = 'position:absolute;inset:' + t + 'px;border-radius:50%;background:var(--surface);';
    var label = el('div', 'cp-ring-pct', Math.round(pct) + '%');
    wrap.appendChild(track); wrap.appendChild(hole); wrap.appendChild(label);
    return wrap;
  }

  // ---- tiny inline sparkline — skips null entries (missing report weeks) ----
  function cpSparkline(values, w, h, color) {
    w = w || 64; h = h || 22;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    var pts0 = [];
    values.forEach(function (v, i) { if (v !== null && v !== undefined) pts0.push([i, v]); });
    if (pts0.length < 2) return svg;
    var vals = pts0.map(function (p) { return p[1]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var range = max - min || 1;
    var stepX = w / (values.length - 1 || 1);
    var pts = pts0.map(function (p) { return [p[0] * stepX, h - 2 - ((p[1] - min) / range) * (h - 4)]; });
    var path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '));
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', color || getVar('--series-1'));
    path.setAttribute('stroke-width', '1.6'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    var last = pts[pts.length - 1];
    var dot = document.createElementNS(svg.namespaceURI, 'circle');
    dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]); dot.setAttribute('r', '2'); dot.setAttribute('fill', color || getVar('--series-1'));
    svg.appendChild(dot);
    return svg;
  }

  // ---- multi-series line chart — used to compare all supporters at once ----
  function cpMultiLineChart(container, seriesList, weekLabels, selectedIdx) {
    var width = 900, height = 220, padL = 30, padR = 10, padT = 10, padB = 22;
    var innerW = width - padL - padR, innerH = height - padT - padB;
    var allVals = [];
    seriesList.forEach(function (s) { s.data.forEach(function (v) { if (v !== null && v !== undefined) allVals.push(v); }); });
    var maxV = Math.max.apply(null, allVals.concat([10]));
    var stepX = innerW / Math.max(1, weekLabels.length - 1);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%'); svg.style.overflow = 'visible';
    for (var g = 0; g <= 4; g++) {
      var y = padT + innerH - (g / 4) * innerH;
      var line = document.createElementNS(svg.namespaceURI, 'line');
      line.setAttribute('x1', padL); line.setAttribute('x2', width - padR); line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', getVar('--grid')); line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      var lbl = document.createElementNS(svg.namespaceURI, 'text');
      lbl.setAttribute('x', 4); lbl.setAttribute('y', y + 3); lbl.setAttribute('font-size', '9'); lbl.setAttribute('fill', getVar('--text-muted'));
      lbl.textContent = Math.round((g / 4) * maxV) + '%';
      svg.appendChild(lbl);
    }
    if (selectedIdx != null) {
      var selX = padL + selectedIdx * stepX;
      var selLine = document.createElementNS(svg.namespaceURI, 'line');
      selLine.setAttribute('x1', selX); selLine.setAttribute('x2', selX); selLine.setAttribute('y1', padT); selLine.setAttribute('y2', padT + innerH);
      selLine.setAttribute('stroke', getVar('--text-muted')); selLine.setAttribute('stroke-width', '1'); selLine.setAttribute('stroke-dasharray', '3,3');
      svg.appendChild(selLine);
    }
    weekLabels.forEach(function (lb, i) {
      var t = document.createElementNS(svg.namespaceURI, 'text');
      t.setAttribute('x', padL + i * stepX); t.setAttribute('y', height - 4); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '9'); t.setAttribute('fill', getVar('--text-muted'));
      t.textContent = lb; svg.appendChild(t);
    });
    seriesList.forEach(function (s) {
      var pts = [];
      s.data.forEach(function (v, i) { if (v !== null && v !== undefined) pts.push([padL + i * stepX, padT + innerH - (v / maxV) * innerH, i]); });
      if (pts.length < 2) return;
      var path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '));
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', '2');
      svg.appendChild(path);
      pts.forEach(function (p) {
        var dot = document.createElementNS(svg.namespaceURI, 'circle');
        dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]); dot.setAttribute('r', p[2] === selectedIdx ? 3.5 : 2);
        dot.setAttribute('fill', s.color);
        svg.appendChild(dot);
      });
    });
    container.appendChild(svg);
    var legend = el('div', 'cp-multiline-legend');
    seriesList.forEach(function (s) {
      var item = el('span', 'cp-multiline-legend-item');
      var dot = el('span', 'cp-multiline-legend-dot'); dot.style.background = s.color;
      item.appendChild(dot); item.appendChild(document.createTextNode(s.label));
      legend.appendChild(item);
    });
    container.appendChild(legend);
  }

  function fmtPct(v) { return v === null || v === undefined ? 'N/A' : (v * 100).toFixed(1) + '%'; }

  function uniqueSorted(arr) { return Array.from(new Set(arr)).sort(); }

  // Team week: Friday → Thursday.
  function weekRange(offsetWeeks) {
    var friday = new Date(weekStartOfClient(Date.now()).getTime() + offsetWeeks * 7 * 86400000);
    var thursday = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + 6, 23, 59, 59, 999);
    return { from: friday.getTime(), to: thursday.getTime() };
  }

  function monthRange(offsetMonths) {
    var now = new Date();
    var first = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1, 0, 0, 0, 0);
    var last = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0, 23, 59, 59, 999);
    return { from: first.getTime(), to: last.getTime() };
  }

  function quarterRange(offsetQuarters) {
    var now = new Date();
    var currentQ = Math.floor(now.getMonth() / 3);
    var startMonth = (currentQ + offsetQuarters) * 3;
    var first = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0);
    var last = new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999);
    return { from: first.getTime(), to: last.getTime() };
  }

  function aggregateBy(list, keyFn) {
    var map = {};
    list.forEach(function (x) {
      var k = keyFn(x) || 'Unknown';
      if (!map[k]) map[k] = { key: k, count: 0, cost: 0, qty: 0 };
      map[k].count += 1;
      map[k].cost += x.cost;
      map[k].qty += x.qty;
    });
    var arr = [];
    for (var k in map) arr.push(map[k]);
    arr.sort(function (a, b) { return b.count - a.count; });
    return arr;
  }

  // Click a header to sort by that column (toggles asc/desc). Used for the
  // "theo kênh/store/sản phẩm/CS agent" breakdowns — filterable/sortable per
  // user request, instead of a fixed bar-list ranked only by count.
  // opts.onRowClick(rowKey) - if given, rows are clickable (cursor
  // pointer, hover highlight, bold when it's the active drill-down) on top
  // of the existing click-header-to-sort behavior. opts.activeKey marks
  // which row (if any) is the currently active drill-down filter.
  function renderSortableTable(container, title, items, columns, opts) {
    opts = opts || {};
    var card = el('div', 'card');
    card.appendChild(el('h3', null, title));
    if (!items.length) {
      card.appendChild(el('div', 'empty-note', 'Chưa có dữ liệu'));
      container.appendChild(card);
      return;
    }
    if (opts.onRowClick) card.appendChild(el('div', 'empty-note', 'Bấm vào 1 dòng để xem chi tiết case bên dưới.'));
    var state = { sortKey: opts.defaultKey || columns[0].key, dir: 'desc' };
    var tableWrap = el('div');
    card.appendChild(tableWrap);

    function draw() {
      tableWrap.innerHTML = '';
      var sorted = items.slice().sort(function (a, b) {
        var va = a[state.sortKey], vb = b[state.sortKey];
        if (typeof va === 'string') return state.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        return state.dir === 'asc' ? va - vb : vb - va;
      });
      var table = el('table', 'data-table');
      var thead = el('thead');
      var headRow = el('tr');
      columns.forEach(function (col) {
        var arrow = state.sortKey === col.key ? (state.dir === 'asc' ? ' ▲' : ' ▼') : '';
        var th = el('th', null, col.label + arrow);
        th.style.cursor = 'pointer';
        th.addEventListener('click', function () {
          if (state.sortKey === col.key) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
          else { state.sortKey = col.key; state.dir = 'desc'; }
          draw();
        });
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);
      var tbody = el('tbody');
      sorted.forEach(function (item) {
        var tr = el('tr');
        if (opts.onRowClick) {
          tr.className = 'row-clickable' + (opts.activeKey === item.key ? ' row-active' : '');
          tr.addEventListener('click', function () { opts.onRowClick(item.key); });
        }
        columns.forEach(function (col) {
          tr.appendChild(el('td', null, col.format ? col.format(item[col.key]) : String(item[col.key])));
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
    }
    draw();
    container.appendChild(card);
  }

  var BREAKDOWN_COLUMNS = [
    { label: 'Tên', key: 'key' },
    { label: 'Case', key: 'count' },
    { label: 'Qty', key: 'qty' },
    { label: '$', key: 'cost', format: function (v) { return '$' + v.toFixed(2); } },
  ];

  function renderPivotTable(container, title, cases, rowKeyFn, colKeyFn, topRowsN, topColsN) {
    var card = el('div', 'card');
    card.appendChild(el('h3', null, title));
    var rowTotals = aggregateBy(cases, rowKeyFn).slice(0, topRowsN);
    var colTotals = aggregateBy(cases, colKeyFn).slice(0, topColsN);
    if (!rowTotals.length || !colTotals.length) {
      card.appendChild(el('div', 'empty-note', 'Chưa có dữ liệu'));
      container.appendChild(card);
      return;
    }
    var rowKeys = rowTotals.map(function (r) { return r.key; });
    var colKeys = colTotals.map(function (r) { return r.key; });
    var table = el('table', 'data-table pivot-table');
    var thead = el('thead');
    var headRow = el('tr');
    headRow.appendChild(el('th', null, ''));
    colKeys.forEach(function (ck) { headRow.appendChild(el('th', null, ck)); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody');
    rowKeys.forEach(function (rk) {
      var tr = el('tr');
      tr.appendChild(el('td', 'pivot-row-label', rk));
      colKeys.forEach(function (ck) {
        var count = cases.filter(function (x) { return (rowKeyFn(x) || 'Unknown') === rk && (colKeyFn(x) || 'Unknown') === ck; }).length;
        var td = el('td', null, count || '');
        if (count) td.style.background = 'color-mix(in srgb, var(--series-1) ' + Math.min(count * 15, 60) + '%, transparent)';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    container.appendChild(card);
  }

  // Collapsed by default (10 rows) — expands in chunks on demand instead of
  // always rendering up to 100 rows, which ate a lot of vertical space.
  function renderCaseTable(container, title, cases) {
    var card = el('div', 'card');
    var sorted = cases.slice().sort(function (a, b) { return (b.date || 0) - (a.date || 0); });
    var pageSize = 10;
    var shown = pageSize;
    var heading = el('h3', null, '');
    card.appendChild(heading);
    var tableWrap = el('div');
    card.appendChild(tableWrap);
    var moreBtn = el('button', 'filter-btn', 'Xem thêm');
    moreBtn.style.marginTop = '8px';
    card.appendChild(moreBtn);

    var columns = [
      { label: 'Ngày', render: function (r) { return r.date ? new Date(r.date).toLocaleDateString('vi-VN') : '—'; } },
      { label: 'Kênh', key: 'channel' },
      { label: 'Store', key: 'store' },
      { label: 'Sản phẩm', key: 'product' },
      { label: 'Loại', key: 'type' },
      { label: 'Qty', key: 'qty' },
      { label: 'Cost', render: function (r) { return '$' + r.cost.toFixed(2); } },
      { label: 'Lý do', key: 'reason' },
      { label: 'Chi tiết', key: 'detail' },
    ];

    function draw() {
      heading.textContent = title + ' (hiện ' + Math.min(shown, sorted.length) + '/' + sorted.length + ')';
      tableWrap.innerHTML = '';
      if (!sorted.length) {
        tableWrap.appendChild(el('div', 'empty-note', 'Không có case nào'));
        moreBtn.style.display = 'none';
        return;
      }
      var table = el('table', 'data-table');
      var thead = el('thead');
      var headRow = el('tr');
      columns.forEach(function (c) { headRow.appendChild(el('th', null, c.label)); });
      thead.appendChild(headRow);
      table.appendChild(thead);
      var tbody = el('tbody');
      sorted.slice(0, shown).forEach(function (r) {
        var tr = el('tr');
        columns.forEach(function (c) {
          tr.appendChild(el('td', null, c.render ? c.render(r) : String(r[c.key] ?? '')));
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      moreBtn.style.display = shown >= sorted.length ? 'none' : 'inline-block';
    }
    moreBtn.addEventListener('click', function () { shown += pageSize; draw(); });
    draw();
    container.appendChild(card);
  }

  // ---- Tab 1: Cancel/Refund ----
  function renderCancelRefund() {
    var c = document.getElementById('panel-cancelRefund');
    var d = DATA.cancelRefund;
    var cases = d.cases;
    var channels = uniqueSorted(cases.map(function (x) { return x.channel; }));

    var state = {
      channel: 'all', store: 'all', product: 'all', agent: 'all', reason: 'all',
      from: Date.now() - 60 * 86400000, to: Date.now(),
    };
    // (label, value) pairs shown as removable chips whenever a drill-down
    // filter is active — kept short so callers just set state[dim] and call
    // applyFilters(); the chip row re-renders itself from current state.
    var DRILL_DIMS = [
      { dim: 'channel', label: 'Kênh' },
      { dim: 'store', label: 'Store' },
      { dim: 'product', label: 'Sản phẩm' },
      { dim: 'agent', label: 'CS agent' },
      { dim: 'reason', label: 'Lý do' },
    ];

    var filterBar = el('div', 'card filter-bar');
    filterBar.appendChild(el('h3', null, 'Bộ lọc (chỉ áp dụng cho phần bên dưới — biểu đồ xu hướng dài hạn không đổi)'));

    var presetRow = el('div', 'filter-row');
    var presets = [
      { label: '7 ngày', days: 7 },
      { label: '30 ngày', days: 30 },
      { label: '60 ngày (mặc định)', days: 60 },
      { label: 'Tuần này', special: 'thisWeek' },
      { label: 'Tuần trước', special: 'lastWeek' },
      { label: 'Tháng này', special: 'thisMonth' },
      { label: 'Tháng trước', special: 'lastMonth' },
      { label: 'Quý này', special: 'thisQuarter' },
      { label: 'Quý trước', special: 'lastQuarter' },
    ];
    var presetButtons = [];
    presets.forEach(function (p, idx) {
      var btn = el('button', 'filter-btn', p.label);
      btn.addEventListener('click', function () {
        presetButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (p.special === 'thisWeek') { var w = weekRange(0); state.from = w.from; state.to = w.to; }
        else if (p.special === 'lastWeek') { var w2 = weekRange(-1); state.from = w2.from; state.to = w2.to; }
        else if (p.special === 'thisMonth') { var m = monthRange(0); state.from = m.from; state.to = m.to; }
        else if (p.special === 'lastMonth') { var m2 = monthRange(-1); state.from = m2.from; state.to = m2.to; }
        else if (p.special === 'thisQuarter') { var q = quarterRange(0); state.from = q.from; state.to = q.to; }
        else if (p.special === 'lastQuarter') { var q2 = quarterRange(-1); state.from = q2.from; state.to = q2.to; }
        else { state.to = Date.now(); state.from = Date.now() - p.days * 86400000; }
        fromInput.value = ''; toInput.value = '';
        applyFilters();
      });
      presetButtons.push(btn);
      presetRow.appendChild(btn);
    });
    presetButtons[2].classList.add('active');

    var customRow = el('div', 'filter-row');
    var fromInput = document.createElement('input'); fromInput.type = 'date'; fromInput.className = 'filter-input';
    var toInput = document.createElement('input'); toInput.type = 'date'; toInput.className = 'filter-input';
    var customBtn = el('button', 'filter-btn', 'Áp dụng ngày tuỳ chọn');
    customBtn.addEventListener('click', function () {
      presetButtons.forEach(function (b) { b.classList.remove('active'); });
      if (fromInput.value) state.from = new Date(fromInput.value).getTime();
      if (toInput.value) state.to = new Date(toInput.value).getTime() + 86399999;
      applyFilters();
    });
    customRow.appendChild(document.createTextNode('Từ:'));
    customRow.appendChild(fromInput);
    customRow.appendChild(document.createTextNode('Đến:'));
    customRow.appendChild(toInput);
    customRow.appendChild(customBtn);

    var selectRow = el('div', 'filter-row');
    var channelSelect = document.createElement('select'); channelSelect.className = 'filter-input';
    channelSelect.appendChild(new Option('Tất cả kênh', 'all'));
    channels.forEach(function (ch) { channelSelect.appendChild(new Option(ch, ch)); });
    var storeSelect = document.createElement('select'); storeSelect.className = 'filter-input';
    function updateStoreOptions() {
      storeSelect.innerHTML = '';
      storeSelect.appendChild(new Option('Tất cả store', 'all'));
      var pool = state.channel === 'all' ? cases : cases.filter(function (x) { return x.channel === state.channel; });
      uniqueSorted(pool.map(function (x) { return x.store; })).forEach(function (s) { storeSelect.appendChild(new Option(s, s)); });
    }
    updateStoreOptions();
    channelSelect.addEventListener('change', function () {
      state.channel = channelSelect.value;
      state.store = 'all';
      updateStoreOptions();
      applyFilters();
    });
    storeSelect.addEventListener('change', function () { state.store = storeSelect.value; applyFilters(); });
    selectRow.appendChild(channelSelect);
    selectRow.appendChild(storeSelect);

    var noteEl = el('div', 'empty-note', '');

    filterBar.appendChild(presetRow);
    filterBar.appendChild(customRow);
    filterBar.appendChild(selectRow);
    filterBar.appendChild(noteEl);
    c.appendChild(filterBar);

    var resultsEl = el('div');
    c.appendChild(resultsEl);

    var trendCard = el('div');
    var cats = d.monthly.map(function (m) { return m.label; });
    renderGroupedBarChart(trendCard, 'Volume theo tháng (xu hướng dài hạn — không đổi theo bộ lọc phía trên)', cats, [
      { label: 'Refund', data: d.monthly.map(function (m) { return m.refund; }) },
      { label: 'Cancel', data: d.monthly.map(function (m) { return m.cancel; }) },
    ]);
    c.appendChild(trendCard);

    // A drill-down click sets state[dim] and re-filters — channel/store also
    // sync their dropdowns so all 3 ways of narrowing (dropdown, chip, row
    // click) always agree on the same state.
    function setDrill(dim, value) {
      var next = state[dim] === value ? 'all' : value; // clicking the active row again clears it
      state[dim] = next;
      if (dim === 'channel') { channelSelect.value = next; state.store = 'all'; updateStoreOptions(); }
      if (dim === 'store') storeSelect.value = next;
      applyFilters();
    }

    function renderChips(container) {
      var active = DRILL_DIMS.filter(function (d) { return state[d.dim] !== 'all'; });
      if (!active.length) return;
      var row = el('div', 'filter-row');
      active.forEach(function (d) {
        var chip = el('span', 'filter-chip');
        chip.appendChild(document.createTextNode(d.label + ': ' + state[d.dim]));
        var x = document.createElement('button');
        x.textContent = '×';
        x.addEventListener('click', function () { setDrill(d.dim, state[d.dim]); }); // toggles off
        chip.appendChild(x);
        row.appendChild(chip);
      });
      container.appendChild(row);
    }

    function applyFilters() {
      var undatedCount = 0;
      var filtered = cases.filter(function (x) {
        if (state.channel !== 'all' && x.channel !== state.channel) return false;
        if (state.store !== 'all' && x.store !== state.store) return false;
        if (state.product !== 'all' && x.product !== state.product) return false;
        if (state.agent !== 'all' && x.agent !== state.agent) return false;
        if (state.reason !== 'all' && x.reason !== state.reason) return false;
        if (x.date === null) { undatedCount += 1; return true; }
        if (state.from && x.date < state.from) return false;
        if (state.to && x.date > state.to) return false;
        return true;
      });
      noteEl.textContent = undatedCount
        ? ('* ' + undatedCount + ' case (TikTok Shop cancel) không có ngày ghi nhận trong nguồn — luôn được tính bất kể bộ lọc ngày.')
        : '';
      resultsEl.innerHTML = '';

      renderChips(resultsEl);

      var total = filtered.length;
      var refund = filtered.filter(function (x) { return x.type === 'Refund'; }).length;
      var cancel = filtered.filter(function (x) { return x.type === 'Cancel'; }).length;
      var totalCost = filtered.reduce(function (s, x) { return s + x.cost; }, 0);
      renderKpis(resultsEl, [
        { label: 'Tổng case (theo bộ lọc)', value: total },
        { label: 'Refund', value: refund, sub: total ? ((refund / total) * 100).toFixed(1) + '%' : '0%' },
        { label: 'Cancel', value: cancel, sub: total ? ((cancel / total) * 100).toFixed(1) + '%' : '0%' },
        { label: 'Tổng $ refund/cancel', value: '$' + totalCost.toFixed(2) },
      ]);

      var grid = el('div', 'grid-2');
      renderSortableTable(grid, 'Theo kênh', aggregateBy(filtered, function (x) { return x.channel; }), BREAKDOWN_COLUMNS,
        { onRowClick: function (key) { setDrill('channel', key); }, activeKey: state.channel });
      renderSortableTable(grid, 'Theo store', aggregateBy(filtered, function (x) { return x.store; }), BREAKDOWN_COLUMNS,
        { onRowClick: function (key) { setDrill('store', key); }, activeKey: state.store });
      resultsEl.appendChild(grid);

      var grid2 = el('div', 'grid-2');
      renderSortableTable(grid2, 'Theo sản phẩm', aggregateBy(filtered.filter(function (x) { return x.product !== 'Unknown'; }), function (x) { return x.product; }), BREAKDOWN_COLUMNS,
        { onRowClick: function (key) { setDrill('product', key); }, activeKey: state.product });
      renderSortableTable(grid2, 'Theo CS agent', aggregateBy(filtered.filter(function (x) { return x.agent !== 'Unknown'; }), function (x) { return x.agent; }), BREAKDOWN_COLUMNS,
        { onRowClick: function (key) { setDrill('agent', key); }, activeKey: state.agent });
      resultsEl.appendChild(grid2);

      renderSortableTable(resultsEl, 'Top lý do (đã phân loại theo từ khoá)',
        aggregateBy(filtered, function (x) { return x.reason; }), BREAKDOWN_COLUMNS,
        { onRowClick: function (key) { setDrill('reason', key); }, activeKey: state.reason });

      renderPivotTable(resultsEl, 'Sản phẩm × Lý do (số case)', filtered,
        function (x) { return x.product; }, function (x) { return x.reason; }, 8, 6);

      renderCaseTable(resultsEl, 'Danh sách case', filtered);
    }

    applyFilters();
  }

  // ---- Tab 2: Channel Performance ----
  // Pass/fail is evaluated entirely client-side against window.__CHANNEL_TARGETS__
  // (mirrors config.js's CHANNEL_PERF_TARGETS) so the same target table drives
  // both the server-rendered supplier config and this interactive tab.
  var CP_TARGETS = window.__CHANNEL_TARGETS__ || {};
  var CP_CS_MAP = window.__CS_MAP__ || {};
  var CP_CHANNEL_ORDER = ['ETSY', 'AMZ', 'TIKTOK', 'WEBSITE'];
  var CP_COLOR = { ETSY: getVar('--series-2'), AMZ: getVar('--series-4'), TIKTOK: getVar('--series-1'), WEBSITE: getVar('--series-3') };

  function cpPassMetric(m, v) {
    if (v === null || v === undefined) return null;
    if (m.direction === 'bool') return !!v;
    if (m.direction === 'higher') return v >= m.threshold;
    return v <= m.threshold;
  }
  function cpStatusMetric(m, v) {
    var p = cpPassMetric(m, v);
    if (p === null) return 'na';
    if (!p) return 'fail';
    if (m.warnMargin == null) return 'pass';
    var dist = m.direction === 'higher' ? v - m.threshold : m.threshold - v;
    return dist <= m.warnMargin ? 'warn' : 'pass';
  }
  function cpFmtValue(m, v) {
    if (v === null || v === undefined) return '—';
    if (m.direction === 'bool') return v ? 'Đạt' : 'Không đạt';
    if (m.unit === '%') return v.toFixed(2) + '%';
    if (m.unit === '★') return v.toFixed(2) + '★';
    if (m.unit === 'h') return v.toFixed(1) + 'h';
    return Number.isInteger(m.threshold) ? String(Math.round(v)) : v.toFixed(1);
  }
  function cpBadgeClass(s) { return s === 'pass' ? 'cp-badge-pass' : s === 'warn' ? 'cp-badge-warn' : s === 'fail' ? 'cp-badge-fail' : 'cp-badge-na'; }
  function cpValAt(acc, key, idx) { var arr = acc.history[key]; return arr ? arr[idx] : null; }
  function cpAccountPassCount(metrics, acc, idx) {
    return metrics.filter(function (m) { var s = cpStatusMetric(m, cpValAt(acc, m.key, idx)); return s === 'pass' || s === 'warn'; }).length;
  }
  function cpAccountFullyPasses(metrics, acc, idx) { return cpAccountPassCount(metrics, acc, idx) === metrics.length; }

  function renderChannelPerformance() {
    var c = document.getElementById('panel-channelPerformance');
    var cd = DATA.channelPerformance || { weeks: [], channels: {} };
    var WEEKS = cd.weeks || [];
    if (!WEEKS.length) {
      c.appendChild(el('div', 'empty-note', 'Chưa có dữ liệu Report Performance nào được ghi nhận.'));
      return;
    }
    var selectedWeek = WEEKS.length - 1;

    var CHANNELS = {};
    CP_CHANNEL_ORDER.forEach(function (key) { CHANNELS[key] = { metrics: CP_TARGETS[key] || [], accounts: (cd.channels[key] || {}).accounts || [] }; });

    var ALL_ENTRIES = [];
    CP_CHANNEL_ORDER.forEach(function (key) {
      CHANNELS[key].accounts.forEach(function (a) { ALL_ENTRIES.push({ channel: key, account: a.account, acc: a, supporter: CP_CS_MAP[a.account] || 'Chưa gán' }); });
    });
    var SUPPORTERS = Array.from(new Set(ALL_ENTRIES.map(function (e) { return e.supporter; }))).sort();
    var SERIES_COLORS = [getVar('--series-1'), getVar('--series-2'), getVar('--series-3'), getVar('--series-4'), CP_COLOR.TIKTOK];

    function cpInitials(name) { return name.replace(/\(.*?\)/g, '').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
    var AVATAR_COLORS = [getVar('--series-1'), getVar('--series-2'), getVar('--series-3'), getVar('--series-4'), '#8a5fd6'];
    function cpAvatarColor(name) { var i = 0; for (var ci = 0; ci < name.length; ci++) i += name.charCodeAt(ci); return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

    function channelPassSeries(ch) {
      return WEEKS.map(function (w, idx) {
        var accs = ch.accounts.filter(function (a) { return cpValAt(a, ch.metrics[0] ? ch.metrics[0].key : '', idx) !== null || ch.metrics.some(function (m) { return cpValAt(a, m.key, idx) !== null; }); });
        var n = accs.filter(function (a) { return cpAccountFullyPasses(ch.metrics, a, idx); }).length;
        return accs.length ? (n / accs.length) * 100 : null;
      });
    }
    function channelPassRate(ch, idx) {
      var accs = ch.accounts.filter(function (a) { return ch.metrics.some(function (m) { return cpValAt(a, m.key, idx) !== null; }); });
      var n = accs.filter(function (a) { return cpAccountFullyPasses(ch.metrics, a, idx); }).length;
      return { n: n, total: accs.length, pct: accs.length ? (n / accs.length) * 100 : 0 };
    }
    function supporterEntries(name) { return ALL_ENTRIES.filter(function (e) { return e.supporter === name; }); }
    function supporterPassSeries(name) {
      var entries = supporterEntries(name);
      return WEEKS.map(function (w, idx) {
        var withData = entries.filter(function (e) { return CHANNELS[e.channel].metrics.some(function (m) { return cpValAt(e.acc, m.key, idx) !== null; }); });
        var n = withData.filter(function (e) { return cpAccountFullyPasses(CHANNELS[e.channel].metrics, e.acc, idx); }).length;
        return withData.length ? (n / withData.length) * 100 : null;
      });
    }
    function supporterPassRate(name, idx) {
      var entries = supporterEntries(name).filter(function (e) { return CHANNELS[e.channel].metrics.some(function (m) { return cpValAt(e.acc, m.key, idx) !== null; }); });
      var n = entries.filter(function (e) { return cpAccountFullyPasses(CHANNELS[e.channel].metrics, e.acc, idx); }).length;
      return { n: n, total: entries.length, pct: entries.length ? (n / entries.length) * 100 : 0 };
    }
    function cpFmtDelta(curr, prev, biggerIsWorse) {
      if (curr == null) return el('span', 'cp-delta cp-delta-flat', '— n/a');
      if (prev == null) return el('span', 'cp-delta cp-delta-flat', '— tuần đầu');
      var d = curr - prev;
      if (Math.abs(d) < 0.05) return el('span', 'cp-delta cp-delta-flat', '→ 0');
      var up = d > 0;
      var worse = biggerIsWorse ? up : !up;
      return el('span', 'cp-delta ' + (worse ? 'cp-delta-up' : 'cp-delta-down'), (up ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1));
    }

    // ---- layout scaffold ----
    var headRow = el('div', 'cp-head-row');
    headRow.appendChild(el('div'));
    var viewToggle = el('div', 'cp-view-toggle');
    var btnChannel = el('button', 'cp-view-btn active', 'Theo kênh');
    var btnSupporter = el('button', 'cp-view-btn', 'Theo Supporter');
    viewToggle.appendChild(btnChannel); viewToggle.appendChild(btnSupporter);
    headRow.appendChild(viewToggle);
    c.appendChild(headRow);

    var weekPicker = el('div', 'cp-week-picker');
    var pickerBtn = el('button', 'cp-week-btn', '📅 Tuần báo cáo: ' + WEEKS[selectedWeek].label + (selectedWeek === WEEKS.length - 1 ? ' (mới nhất)' : ''));
    var pop = el('div', 'cp-week-pop');
    weekPicker.appendChild(pickerBtn); weekPicker.appendChild(pop);
    pickerBtn.addEventListener('click', function (ev) { ev.stopPropagation(); pop.classList.toggle('open'); });
    document.addEventListener('click', function (ev) { if (!weekPicker.contains(ev.target)) pop.classList.remove('open'); });
    c.appendChild(weekPicker);

    var healthRow = el('div', 'cp-row-full'); c.appendChild(healthRow);
    var topRow = el('div', 'cp-card-row'); c.appendChild(topRow);

    // Issue rate theo KÊNH (không phải theo account/supporter — xem ghi chú
    // trong analyze/channelWorkload.js lý do chưa xuống được cấp account).
    (function renderChannelWorkload() {
      var wl = DATA.channelWorkload;
      if (!wl) return;
      var card = el('div', 'card'); card.style.marginBottom = '16px';
      card.appendChild(el('div', 'section-title', 'Issue rate theo kênh (Cancel/Refund + PayPal Dispute ÷ số đơn xử lý)'));
      var note = el('div', 'empty-note', 'Chuẩn hoá theo khối lượng đơn thay vì chỉ đếm case thô — issue rate thấp trên khối lượng lớn phản ánh vận hành tốt hơn hẳn issue rate thấp trên khối lượng nhỏ. WEBSITE chưa có "đơn" (sẽ dùng số ticket Zendesk khi nối xong).');
      note.style.textAlign = 'left'; note.style.padding = '0 0 10px';
      card.appendChild(note);
      var table = el('table', 'data-table');
      var thead = el('thead'); var hr = el('tr');
      ['Kênh', 'Số đơn xử lý', 'Số issue', 'Issue rate'].forEach(function (h) { hr.appendChild(el('th', null, h)); });
      thead.appendChild(hr); table.appendChild(thead);
      var tbody = el('tbody');
      CP_CHANNEL_ORDER.forEach(function (key) {
        var w = wl[key] || { volume: 0, issues: 0, issueRate: null };
        var tr = el('tr');
        var chanTd = el('td'); var tag = el('span', 'cp-chan-tag', key); tag.style.background = CP_COLOR[key]; chanTd.appendChild(tag);
        tr.appendChild(chanTd);
        tr.appendChild(el('td', null, w.volume ? w.volume.toLocaleString('vi-VN') : '—'));
        tr.appendChild(el('td', null, String(w.issues)));
        if (w.issueRate == null) {
          tr.appendChild(el('td', null, '—'));
        } else {
          var cls = w.issueRate <= 1.5 ? 'cp-badge-pass' : w.issueRate <= 3 ? 'cp-badge-warn' : 'cp-badge-fail';
          tr.appendChild(el('td', null, '<span class="cp-badge ' + cls + '">' + w.issueRate.toFixed(2) + '%</span>'));
        }
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      card.appendChild(table);
      c.appendChild(card);
    })();

    var supporterCompareCard = el('div', 'card'); supporterCompareCard.style.marginBottom = '16px'; c.appendChild(supporterCompareCard);
    var reviewRecoveryCard = el('div', 'card'); reviewRecoveryCard.style.marginBottom = '16px'; c.appendChild(reviewRecoveryCard);
    var watchCard = el('div', 'card'); watchCard.style.marginBottom = '16px';
    var watchTitle = el('div', 'section-title', 'Account cần chú ý');
    var watchGrid = el('div', 'cp-watch-grid');
    watchCard.appendChild(watchTitle); watchCard.appendChild(watchGrid);
    c.appendChild(watchCard);
    var channelPanel = el('div'); var supporterPanel = el('div');
    c.appendChild(channelPanel); c.appendChild(supporterPanel);

    function buildCalendarPopover() {
      pop.innerHTML = '';
      var monthMap = {};
      WEEKS.forEach(function (w) {
        var dt = new Date(w.key);
        var mk = dt.getFullYear() + '-' + dt.getMonth();
        if (!monthMap[mk]) monthMap[mk] = { first: new Date(dt.getFullYear(), dt.getMonth(), 1), weeks: [] };
        monthMap[mk].weeks.push({ idx: WEEKS.indexOf(w), date: dt });
      });
      var DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      Object.keys(monthMap).sort().forEach(function (mk) {
        var info = monthMap[mk];
        var monthEl = el('div', 'cp-cal-month');
        monthEl.appendChild(el('div', 'cp-cal-month-title', 'Tháng ' + (info.first.getMonth() + 1) + '/' + info.first.getFullYear()));
        var grid = el('div', 'cp-cal-grid');
        DOW.forEach(function (d) { grid.appendChild(el('div', 'cp-cal-dow', d)); });
        var startOffset = info.first.getDay();
        var daysInMonth = new Date(info.first.getFullYear(), info.first.getMonth() + 1, 0).getDate();
        for (var i = 0; i < startOffset; i++) grid.appendChild(el('div', 'cp-cal-day', ''));
        for (var d2 = 1; d2 <= daysInMonth; d2++) {
          var matchWeek = info.weeks.find(function (w) { return w.date.getDate() === d2; });
          var cell = el('div', 'cp-cal-day' + (matchWeek ? ' report' : '') + (matchWeek && matchWeek.idx === selectedWeek ? ' selected' : ''), String(d2));
          if (matchWeek) {
            cell.addEventListener('click', (function (mw) {
              return function () {
                selectedWeek = mw.idx;
                pop.classList.remove('open');
                pickerBtn.textContent = '📅 Tuần báo cáo: ' + WEEKS[selectedWeek].label + (selectedWeek === WEEKS.length - 1 ? ' (mới nhất)' : '');
                buildCalendarPopover();
                cpRerenderAll();
              };
            })(matchWeek));
          }
          grid.appendChild(cell);
        }
        monthEl.appendChild(grid);
        pop.appendChild(monthEl);
      });
      pop.appendChild(el('div', 'cp-cal-note', 'Chỉ ngày tô đậm mới có báo cáo (nhập tay Thứ 4-5 hàng tuần) — ngày khác không bấm được.'));
    }

    var currentView = 'channel';
    var activeEntity = { channel: null, supporter: null };
    var channelCardEls = {}, supporterCardEls = {};

    function renderHealthRow() {
      healthRow.innerHTML = '';
      var totalAccounts = ALL_ENTRIES.length;
      var totalPass = ALL_ENTRIES.filter(function (e) { return cpAccountFullyPasses(CHANNELS[e.channel].metrics, e.acc, selectedWeek); }).length;
      var overallPct = totalAccounts ? (totalPass / totalAccounts) * 100 : 0;
      var prevPct = selectedWeek > 0
        ? (function () { var p = ALL_ENTRIES.filter(function (e) { return cpAccountFullyPasses(CHANNELS[e.channel].metrics, e.acc, selectedWeek - 1); }).length; return totalAccounts ? (p / totalAccounts) * 100 : 0; })()
        : null;
      var healthCard = el('div', 'card cp-health-card');
      healthCard.appendChild(cpRing(overallPct, getVar('--series-1'), 84, 9));
      var healthText = el('div');
      healthText.appendChild(el('div', 'section-title', 'Overall health — tuần ' + WEEKS[selectedWeek].label));
      healthText.appendChild(el('div', null, '<b style="font-size:22px;">' + totalPass + '/' + totalAccounts + '</b> <span style="font-size:12px;color:var(--text-muted);">account đạt chuẩn toàn bộ chỉ số</span>'));
      var deltaWrap = el('div'); deltaWrap.style.marginTop = '4px';
      deltaWrap.appendChild(cpFmtDelta(overallPct, prevPct, false));
      healthText.appendChild(deltaWrap);
      healthCard.appendChild(healthText);
      healthRow.appendChild(healthCard);
    }

    function renderTopRow() {
      topRow.innerHTML = '';
      if (currentView === 'channel') {
        CP_CHANNEL_ORDER.forEach(function (key) {
          var ch = CHANNELS[key];
          var r = channelPassRate(ch, selectedWeek);
          var rPrev = selectedWeek > 0 ? channelPassRate(ch, selectedWeek - 1) : null;
          var card = el('div', 'card cp-entity-card');
          var head = el('div', 'cp-entity-head');
          head.appendChild(cpRing(r.pct, CP_COLOR[key], 52, 7));
          var nameWrap = el('div');
          nameWrap.appendChild(el('div', 'cp-entity-name', key));
          nameWrap.appendChild(el('div', 'cp-entity-sub', r.n + '/' + r.total + ' account đạt'));
          nameWrap.appendChild(cpFmtDelta(r.pct, rPrev ? rPrev.pct : null, false));
          head.appendChild(nameWrap);
          card.appendChild(head);
          card.appendChild(cpSparkline(channelPassSeries(ch), 180, 26, CP_COLOR[key]));
          ch.metrics.slice(0, 5).forEach(function (m) {
            var withData = ch.accounts.filter(function (a) { return cpValAt(a, m.key, selectedWeek) !== null; });
            var passN = withData.filter(function (a) { var s = cpStatusMetric(m, cpValAt(a, m.key, selectedWeek)); return s === 'pass' || s === 'warn'; }).length;
            var pct = withData.length ? (passN / withData.length) * 100 : 0;
            var row = el('div', 'cp-metric-bar-row');
            row.appendChild(el('div', 'cp-metric-bar-label', m.label));
            var track = el('div', 'cp-metric-bar-track');
            var fill = el('div', 'cp-metric-bar-fill');
            fill.style.width = pct + '%';
            fill.style.background = pct >= 80 ? getVar('--good') : pct >= 50 ? getVar('--warning') : getVar('--critical');
            track.appendChild(fill);
            row.appendChild(track);
            row.appendChild(el('div', 'cp-metric-bar-value', passN + '/' + withData.length));
            card.appendChild(row);
          });
          card.addEventListener('click', function () { openChannel(key); });
          channelCardEls[key] = card;
          topRow.appendChild(card);
        });
      } else {
        SUPPORTERS.slice().sort(function (a, b) { return supporterPassRate(a, selectedWeek).pct - supporterPassRate(b, selectedWeek).pct; }).forEach(function (name) {
          var r = supporterPassRate(name, selectedWeek);
          var rPrev = selectedWeek > 0 ? supporterPassRate(name, selectedWeek - 1) : null;
          var entries = supporterEntries(name);
          var byChan = {};
          entries.forEach(function (e) { byChan[e.channel] = (byChan[e.channel] || 0) + 1; });
          var card = el('div', 'card cp-entity-card');
          var head = el('div', 'cp-entity-head');
          var av = el('div', 'cp-avatar', cpInitials(name));
          av.style.background = cpAvatarColor(name);
          head.appendChild(av);
          var nameWrap = el('div');
          nameWrap.appendChild(el('div', 'cp-entity-name', name));
          nameWrap.appendChild(el('div', 'cp-entity-sub', r.n + '/' + r.total + ' account đạt'));
          head.appendChild(nameWrap);
          head.appendChild(cpRing(r.pct, getVar('--series-1'), 52, 7));
          card.appendChild(head);
          var deltaRow = el('div'); deltaRow.appendChild(cpFmtDelta(r.pct, rPrev ? rPrev.pct : null, false));
          card.appendChild(deltaRow);
          card.appendChild(cpSparkline(supporterPassSeries(name), 180, 26, getVar('--series-1')));
          var chips = el('div', 'cp-entity-chips');
          Object.keys(byChan).forEach(function (ck) { chips.appendChild(el('span', 'cp-entity-chip', ck + ' ' + byChan[ck])); });
          card.appendChild(chips);
          card.addEventListener('click', function () { openSupporter(name); });
          supporterCardEls[name] = card;
          topRow.appendChild(card);
        });
      }
    }

    function renderSupporterCompare() {
      supporterCompareCard.innerHTML = '';
      if (currentView !== 'supporter') { supporterCompareCard.style.display = 'none'; return; }
      supporterCompareCard.style.display = 'block';
      supporterCompareCard.appendChild(el('div', 'section-title', 'So sánh xu hướng % đạt chuẩn giữa các Supporter'));
      var wrap = el('div');
      var seriesList = SUPPORTERS.map(function (name, i) { return { label: name, data: supporterPassSeries(name), color: SERIES_COLORS[i % SERIES_COLORS.length] }; });
      cpMultiLineChart(wrap, seriesList, WEEKS.map(function (w) { return w.label; }), selectedWeek);
      supporterCompareCard.appendChild(wrap);
    }

    function renderReviewRecovery() {
      reviewRecoveryCard.innerHTML = '';
      if (currentView !== 'supporter') { reviewRecoveryCard.style.display = 'none'; return; }
      reviewRecoveryCard.style.display = 'block';
      reviewRecoveryCard.appendChild(el('div', 'section-title', 'Review recovery theo Supporter (review 1-2★ đã liên hệ khách + xử lý)'));
      var note = el('div', 'empty-note', 'Chỉ tính Etsy + TikTok (2 nền tảng cho phép liên hệ khách nâng lại sao qua "Resolve"). AMZ chỉ đếm review xấu, không có bước xử lý (chính sách Amazon không cho phép).');
      note.style.textAlign = 'left'; note.style.padding = '0 0 10px';
      reviewRecoveryCard.appendChild(note);
      var rr = DATA.reviewRecovery || {};
      var rows = SUPPORTERS.map(function (name) { return { name: name, r: rr[name] || { negTotal: 0, negResolved: 0, recoveryPct: null, amzNegTotal: 0 } }; })
        .filter(function (x) { return x.r.negTotal > 0 || x.r.amzNegTotal > 0; })
        .sort(function (a, b) { var ra = a.r.recoveryPct == null ? -1 : a.r.recoveryPct; var rb = b.r.recoveryPct == null ? -1 : b.r.recoveryPct; return rb - ra; });
      if (!rows.length) { reviewRecoveryCard.appendChild(el('div', 'empty-note', 'Chưa có review xấu nào được ghi nhận.')); return; }
      var table = el('table', 'data-table');
      var thead = el('thead'); var hr = el('tr');
      ['Supporter', 'Review xấu (Etsy+TikTok)', 'Đã xử lý', 'Recovery rate', 'Review xấu AMZ (không xử lý được)'].forEach(function (h) { hr.appendChild(el('th', null, h)); });
      thead.appendChild(hr); table.appendChild(thead);
      var tbody = el('tbody');
      rows.forEach(function (x) {
        var tr = el('tr');
        tr.appendChild(el('td', null, '<b>' + x.name + '</b>'));
        tr.appendChild(el('td', null, String(x.r.negTotal)));
        tr.appendChild(el('td', null, String(x.r.negResolved)));
        if (x.r.recoveryPct == null) {
          tr.appendChild(el('td', null, '—'));
        } else {
          var cls = x.r.recoveryPct >= 60 ? 'cp-badge-pass' : x.r.recoveryPct >= 30 ? 'cp-badge-warn' : 'cp-badge-fail';
          tr.appendChild(el('td', null, '<span class="cp-badge ' + cls + '">' + x.r.recoveryPct.toFixed(0) + '%</span>'));
        }
        tr.appendChild(el('td', null, String(x.r.amzNegTotal)));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      reviewRecoveryCard.appendChild(table);
    }

    function renderWatch() {
      watchGrid.innerHTML = '';
      var watchItems = [];
      ALL_ENTRIES.forEach(function (e) {
        var ch = CHANNELS[e.channel];
        var failing = ch.metrics.filter(function (m) { return cpStatusMetric(m, cpValAt(e.acc, m.key, selectedWeek)) === 'fail'; });
        if (failing.length >= 2) watchItems.push({ channel: e.channel, account: e.account, supporter: e.supporter, failing: failing, acc: e.acc });
      });
      watchTitle.textContent = 'Account cần chú ý — fail ≥2 chỉ số, tuần ' + WEEKS[selectedWeek].label + ' (' + watchItems.length + ' account)';
      if (!watchItems.length) watchGrid.appendChild(el('div', 'empty-note', 'Không có account nào fail từ 2 chỉ số trở lên tuần này.'));
      watchItems.forEach(function (w) {
        var card = el('div', 'cp-watch-card');
        var head = el('div', 'cp-watch-head');
        head.appendChild(el('div', 'cp-watch-count', String(w.failing.length)));
        var nameWrap = el('div');
        nameWrap.appendChild(el('div', 'cp-watch-name', w.account));
        nameWrap.appendChild(el('div', 'cp-watch-chan', w.channel + ' · ' + w.supporter));
        head.appendChild(nameWrap);
        card.appendChild(head);
        var chips = el('div', 'cp-watch-chips');
        w.failing.forEach(function (m) { chips.appendChild(el('span', 'cp-watch-chip', m.label + ' ' + cpFmtValue(m, cpValAt(w.acc, m.key, selectedWeek)))); });
        card.appendChild(chips);
        card.addEventListener('click', function () { switchView('channel'); openChannel(w.channel, w.account); });
        watchGrid.appendChild(card);
      });
    }

    function buildDetailRow(ch, a, colSpan) {
      var detailTr = el('tr', 'cp-detail-row');
      var detailTd = el('td');
      detailTd.colSpan = colSpan;
      var grid = el('div', 'cp-detail-grid');
      ch.metrics.forEach(function (m) {
        var v = cpValAt(a, m.key, selectedWeek);
        var prevV = selectedWeek > 0 ? cpValAt(a, m.key, selectedWeek - 1) : null;
        var status = cpStatusMetric(m, v);
        var tile = el('div', 'cp-detail-tile');
        tile.appendChild(el('div', 'cp-detail-tile-label', m.label + ' · target ' + (m.direction === 'bool' ? 'Đạt' : (m.direction === 'higher' ? '≥ ' : '≤ ') + m.threshold + m.unit)));
        var row = el('div', 'cp-detail-tile-value-row');
        row.appendChild(el('span', 'cp-detail-tile-value cp-' + status, cpFmtValue(m, v)));
        if (v != null && prevV != null && m.direction !== 'bool') {
          var d = v - prevV;
          var worse = m.direction === 'higher' ? d < 0 : d > 0;
          if (Math.abs(d) >= (m.warnMargin ? m.warnMargin * 0.2 : 0.02)) {
            row.appendChild(el('span', 'cp-detail-tile-delta cp-' + (worse ? 'fail' : 'pass'), (d > 0 ? '▲' : '▼') + Math.abs(d).toFixed(2)));
          }
        }
        tile.appendChild(row);
        if (m.direction !== 'bool') tile.appendChild(cpSparkline(a.history[m.key], 80, 22, status === 'fail' ? getVar('--critical') : status === 'warn' ? getVar('--warning') : getVar('--good')));
        grid.appendChild(tile);
      });
      detailTd.appendChild(grid);
      detailTr.appendChild(detailTd);
      return detailTr;
    }

    var channelSections = {};
    CP_CHANNEL_ORDER.forEach(function (key) {
      var ch = CHANNELS[key];
      var section = el('div', 'card cp-detail-section');
      var titleEl = el('div', 'section-title', key + ' — chi tiết theo account');
      section.appendChild(titleEl);
      var ringRowWrap = el('div'); section.appendChild(ringRowWrap);
      var activeMetricFilter = null;
      var tableWrap = el('div'); section.appendChild(tableWrap);
      var sortState = { key: 'account', dir: 'asc' };
      var openAccount = null;

      function drawRings() {
        ringRowWrap.innerHTML = '';
        var ringRow = el('div', 'cp-ring-row');
        ch.metrics.forEach(function (m) {
          var withData = ch.accounts.filter(function (a) { return cpValAt(a, m.key, selectedWeek) !== null; });
          var passN = withData.filter(function (a) { var s = cpStatusMetric(m, cpValAt(a, m.key, selectedWeek)); return s === 'pass' || s === 'warn'; }).length;
          var pct = withData.length ? (passN / withData.length) * 100 : 0;
          var tile = el('div', 'cp-ring-tile' + (activeMetricFilter === m.key ? ' active' : ''));
          tile.appendChild(cpRing(pct, pct >= 80 ? getVar('--good') : pct >= 50 ? getVar('--warning') : getVar('--critical'), 56, 7));
          tile.appendChild(el('div', 'cp-ring-tile-label', m.label));
          tile.appendChild(el('div', 'cp-ring-tile-sub', 'target ' + (m.direction === 'bool' ? 'Đạt' : (m.direction === 'higher' ? '≥ ' : '≤ ') + m.threshold + m.unit)));
          tile.addEventListener('click', function () { activeMetricFilter = activeMetricFilter === m.key ? null : m.key; drawRings(); drawTable(); });
          ringRow.appendChild(tile);
        });
        ringRowWrap.appendChild(ringRow);
      }

      function drawTable() {
        titleEl.textContent = key + ' — chi tiết theo account, tuần ' + WEEKS[selectedWeek].label;
        tableWrap.innerHTML = '';
        var rows = ch.accounts.filter(function (a) {
          if (!activeMetricFilter) return true;
          var m = ch.metrics.find(function (mm) { return mm.key === activeMetricFilter; });
          return cpStatusMetric(m, cpValAt(a, activeMetricFilter, selectedWeek)) === 'fail';
        }).slice().sort(function (a, b) {
          var va = sortState.key === 'account' ? a.account : cpValAt(a, sortState.key, selectedWeek);
          var vb = sortState.key === 'account' ? b.account : cpValAt(b, sortState.key, selectedWeek);
          if (va === null) return 1; if (vb === null) return -1;
          if (typeof va === 'string') return sortState.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
          return sortState.dir === 'asc' ? va - vb : vb - va;
        });
        if (activeMetricFilter) {
          var mLabel = ch.metrics.find(function (mm) { return mm.key === activeMetricFilter; }).label;
          var note = el('div', 'empty-note', 'Đang lọc: account fail "' + mLabel + '" (' + rows.length + ') — bấm lại vòng tròn để bỏ lọc');
          note.style.padding = '0 0 8px'; note.style.textAlign = 'left'; note.style.color = getVar('--critical');
          tableWrap.appendChild(note);
        }
        var table = el('table', 'data-table');
        var thead = el('thead'); var headRow = el('tr');
        headRow.appendChild(mkTh('Account', 'account'));
        ch.metrics.forEach(function (m) { headRow.appendChild(mkTh(m.label, m.key)); });
        headRow.appendChild(el('th', null, 'Xu hướng'));
        thead.appendChild(headRow); table.appendChild(thead);
        var tbody = el('tbody');
        if (!rows.length) {
          var emptyTr = el('tr'); var emptyTd = el('td', 'empty-note', 'Không có account nào'); emptyTd.colSpan = ch.metrics.length + 2; emptyTr.appendChild(emptyTd); tbody.appendChild(emptyTr);
        }
        rows.forEach(function (a) {
          var tr = el('tr');
          if (openAccount === a.account) tr.classList.add('row-active');
          tr.appendChild(el('td', null, '<b>' + a.account + '</b>'));
          ch.metrics.forEach(function (m) {
            var v = cpValAt(a, m.key, selectedWeek);
            var status = cpStatusMetric(m, v);
            tr.appendChild(el('td', null, '<span class="cp-badge ' + cpBadgeClass(status) + '">' + cpFmtValue(m, v) + '</span>'));
          });
          var sparkTd = el('td');
          var passSeries = WEEKS.map(function (w, idx) { return cpAccountPassCount(ch.metrics, a, idx); });
          sparkTd.appendChild(cpSparkline(passSeries, 60, 20, getVar('--series-1')));
          tr.appendChild(sparkTd);
          tr.addEventListener('click', function () { openAccount = openAccount === a.account ? null : a.account; drawTable(); });
          tbody.appendChild(tr);
          if (openAccount === a.account) tbody.appendChild(buildDetailRow(ch, a, ch.metrics.length + 2));
        });
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        function mkTh(label, key2) {
          var arrow = sortState.key === key2 ? (sortState.dir === 'asc' ? ' ▲' : ' ▼') : '';
          var th = el('th', null, label + arrow);
          th.addEventListener('click', function () {
            if (sortState.key === key2) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
            else { sortState.key = key2; sortState.dir = 'asc'; }
            drawTable();
          });
          return th;
        }
      }
      drawRings(); drawTable();
      channelSections[key] = {
        section: section, redraw: function () { drawRings(); drawTable(); },
        openAccountFn: function (name) { openAccount = name; drawTable(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      };
      channelPanel.appendChild(section);
    });

    function openChannel(key, focusAccount) {
      CP_CHANNEL_ORDER.forEach(function (k) {
        var isTarget = k === key;
        var wasOpen = channelSections[k].section.classList.contains('open');
        channelSections[k].section.classList.toggle('open', isTarget ? !(wasOpen && activeEntity.channel === key) : false);
        channelCardEls[k] && channelCardEls[k].classList.toggle('active', isTarget && channelSections[k].section.classList.contains('open'));
      });
      activeEntity.channel = channelSections[key].section.classList.contains('open') ? key : null;
      if (channelSections[key].section.classList.contains('open')) {
        if (focusAccount) channelSections[key].openAccountFn(focusAccount);
        else channelSections[key].section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    var supporterSections = {};
    SUPPORTERS.forEach(function (name) {
      var entries = supporterEntries(name);
      var section = el('div', 'card cp-detail-section');
      var titleEl = el('div', 'section-title', name);
      section.appendChild(titleEl);
      var tableWrap = el('div'); section.appendChild(tableWrap);
      var sortState = { key: 'account', dir: 'asc' };
      var openAccount = null;

      function drawTable() {
        titleEl.textContent = name + ' — ' + entries.length + ' account phụ trách, tuần ' + WEEKS[selectedWeek].label;
        tableWrap.innerHTML = '';
        var rows = entries.slice().sort(function (a, b) {
          function val(e) { return sortState.key === 'pass' ? cpAccountPassCount(CHANNELS[e.channel].metrics, e.acc, selectedWeek) : e[sortState.key]; }
          var va = val(a), vb = val(b);
          if (typeof va === 'string') return sortState.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
          return sortState.dir === 'asc' ? va - vb : vb - va;
        });
        var table = el('table', 'data-table');
        var thead = el('thead'); var headRow = el('tr');
        headRow.appendChild(mkTh('Account', 'account'));
        headRow.appendChild(mkTh('Kênh', 'channel'));
        headRow.appendChild(mkTh('Chỉ số đạt', 'pass'));
        headRow.appendChild(el('th', null, 'Trạng thái'));
        headRow.appendChild(el('th', null, 'Xu hướng'));
        thead.appendChild(headRow); table.appendChild(thead);
        var tbody = el('tbody');
        rows.forEach(function (e) {
          var ch = CHANNELS[e.channel];
          var passN = cpAccountPassCount(ch.metrics, e.acc, selectedWeek);
          var full = passN === ch.metrics.length;
          var tr = el('tr');
          if (openAccount === e.account) tr.classList.add('row-active');
          tr.appendChild(el('td', null, '<b>' + e.account + '</b>'));
          var chanTd = el('td');
          var tag = el('span', 'cp-chan-tag', e.channel);
          tag.style.background = CP_COLOR[e.channel];
          chanTd.appendChild(tag);
          tr.appendChild(chanTd);
          tr.appendChild(el('td', null, passN + '/' + ch.metrics.length));
          tr.appendChild(el('td', null, '<span class="cp-badge ' + (full ? 'cp-badge-pass' : 'cp-badge-fail') + '">' + (full ? 'Đạt' : 'Không đạt') + '</span>'));
          var sparkTd = el('td');
          var passSeries = WEEKS.map(function (w, idx) { return cpAccountPassCount(ch.metrics, e.acc, idx); });
          sparkTd.appendChild(cpSparkline(passSeries, 60, 20, getVar('--series-1')));
          tr.appendChild(sparkTd);
          tr.addEventListener('click', function () { openAccount = openAccount === e.account ? null : e.account; drawTable(); });
          tbody.appendChild(tr);
          if (openAccount === e.account) tbody.appendChild(buildDetailRow(ch, e.acc, 5));
        });
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        function mkTh(label, key2) {
          var arrow = sortState.key === key2 ? (sortState.dir === 'asc' ? ' ▲' : ' ▼') : '';
          var th = el('th', null, label + arrow);
          th.addEventListener('click', function () {
            if (sortState.key === key2) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
            else { sortState.key = key2; sortState.dir = 'asc'; }
            drawTable();
          });
          return th;
        }
      }
      drawTable();
      supporterSections[name] = {
        section: section, redraw: drawTable,
        openAccountFn: function (acc) { openAccount = acc; drawTable(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      };
      supporterPanel.appendChild(section);
    });

    function openSupporter(name) {
      SUPPORTERS.forEach(function (n) {
        var isTarget = n === name;
        var wasOpen = supporterSections[n].section.classList.contains('open');
        supporterSections[n].section.classList.toggle('open', isTarget ? !(wasOpen && activeEntity.supporter === name) : false);
        supporterCardEls[n] && supporterCardEls[n].classList.toggle('active', isTarget && supporterSections[n].section.classList.contains('open'));
      });
      activeEntity.supporter = supporterSections[name].section.classList.contains('open') ? name : null;
      if (supporterSections[name].section.classList.contains('open')) supporterSections[name].section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function switchView(view) {
      currentView = view;
      btnChannel.classList.toggle('active', view === 'channel');
      btnSupporter.classList.toggle('active', view === 'supporter');
      channelPanel.style.display = view === 'channel' ? 'block' : 'none';
      supporterPanel.style.display = view === 'supporter' ? 'block' : 'none';
      renderTopRow();
      renderSupporterCompare();
      renderReviewRecovery();
    }
    btnChannel.addEventListener('click', function () { switchView('channel'); });
    btnSupporter.addEventListener('click', function () { switchView('supporter'); });

    function cpRerenderAll() {
      renderHealthRow();
      renderTopRow();
      renderSupporterCompare();
      renderWatch();
      CP_CHANNEL_ORDER.forEach(function (k) { channelSections[k].redraw(); });
      SUPPORTERS.forEach(function (n) { supporterSections[n].redraw(); });
    }

    buildCalendarPopover();
    supporterPanel.style.display = 'none';
    renderHealthRow();
    renderTopRow();
    renderSupporterCompare();
    renderReviewRecovery();
    renderWatch();
  }

  // ---- Tab 3: FBA Issues ----
  function renderFbaIssues() {
    var c = document.getElementById('panel-fbaIssues');
    var d = DATA.fbaIssues;
    renderKpis(c, d.kpis);
    var cats = d.monthly.map(function (m) { return m.label; });
    renderGroupedBarChart(c, 'Issue theo tháng', cats, [{ label: 'Issue', data: d.monthly.map(function (m) { return m.count; }) }]);
    var grid = el('div', 'grid-2');
    renderBarList(grid, 'Theo supplier', d.breakdowns.bySupplier, 'count');
    renderBarList(grid, 'Theo FF place', d.breakdowns.byFfPlace, 'count');
    c.appendChild(grid);
    var grid2 = el('div', 'grid-2');
    renderBarList(grid2, 'Theo loại sản phẩm', d.breakdowns.byProductType, 'count');
    renderBarList(grid2, 'Theo CS', d.breakdowns.byCs, 'count');
    c.appendChild(grid2);
    renderTable(c, 'Top loại issue', [{ label: 'Issue', key: 'issue' }, { label: 'Số lần', key: 'count' }], d.topIssues);
  }

  // ---- Tab 4: PayPal Dispute ----
  function renderPaypalDispute() {
    var c = document.getElementById('panel-paypalDispute');
    var d = DATA.paypalDispute;
    renderKpis(c, d.kpis);
    var cats = d.monthly.map(function (m) { return m.label; });
    renderGroupedBarChart(c, 'Win/Lost theo tháng', cats, [
      { label: 'Win', data: d.monthly.map(function (m) { return m.win; }) },
      { label: 'Lost', data: d.monthly.map(function (m) { return m.lost; }) },
    ]);
    renderTable(c, 'Win rate theo Case Reason',
      [{ label: 'Case Reason', key: 'key' }, { label: 'Số case', key: 'count' },
       { label: 'Win rate', render: function (r) { return fmtPct(r.winRate); } }],
      d.winRateByReason);
    var grid = el('div', 'grid-2');
    renderBarList(grid, 'Theo supplier', d.breakdowns.bySupplier, 'count');
    renderBarList(grid, 'Theo shipping status', d.breakdowns.byShippingStatus, 'count');
    c.appendChild(grid);
  }

  // ---- Tab 5: Orders by channel ----
  function renderOrdersByChannel() {
    var c = document.getElementById('panel-ordersByChannel');
    var d = DATA.ordersByChannel;
    renderKpis(c, d.kpis);
    var cats = d.monthlyByChannel.map(function (m) { return m.label; });
    renderGroupedBarChart(c, 'Số đơn theo kênh / tháng', cats,
      d.channels.map(function (ch) { return { label: ch, data: d.monthlyByChannel.map(function (m) { return m[ch] || 0; }) }; }));
    var grid = el('div', 'grid-2');
    renderBarList(grid, 'Theo kênh (số đơn)', d.byChannel, 'count');
    renderBarList(grid, 'Theo store (số đơn)', d.byStore, 'count');
    c.appendChild(grid);
    renderTable(c, 'Chi tiết theo kênh',
      [{ label: 'Kênh', key: 'key' }, { label: 'Đơn', key: 'count' }, { label: 'SL', key: 'qty' },
       { label: 'Fee', render: function (r) { return '$' + r.fee.toFixed(2); } },
       { label: 'COGS + label', render: function (r) { return '$' + (r.cogs + r.buyLabel).toFixed(2); } }],
      d.byChannel);
  }

  function computeDelta(curr, prev) {
    if (!prev) return null;
    return ((curr - prev) / prev) * 100;
  }

  // Team week runs Friday through Thursday (members load data / review
  // Wed afternoon-Thu) — not the ISO Mon-Sun default.
  function weekStartOfClient(ts) {
    var d = new Date(ts);
    var day = d.getDay(); // 0=Sun..6=Sat
    var daysSinceFriday = (day - 5 + 7) % 7;
    var friday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceFriday);
    friday.setHours(0, 0, 0, 0);
    return friday;
  }

  function weekKeyClient(ts) {
    var f = weekStartOfClient(ts);
    return f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
  }

  function weekLabelClient(key) {
    var parts = key.split('-');
    return parts[2] + '/' + parts[1];
  }

  // The current week (Fri-Thu) is always in progress until Thursday night,
  // so comparing it to a full previous week would be misleading — it'd look
  // artificially low no matter what. Instead we always compare the last two
  // FULLY completed weeks (this week's Friday minus 7 days, and minus 14).
  function lastCompleteWeekKeys() {
    var thisFriday = weekStartOfClient(Date.now()).getTime();
    return {
      current: weekKeyClient(thisFriday - 7 * 86400000),
      previous: weekKeyClient(thisFriday - 14 * 86400000),
    };
  }

  function findByKey(arr, key) {
    for (var i = 0; i < arr.length; i++) if (arr[i].key === key) return arr[i];
    return null;
  }

  function renderStatusCard(container, opts) {
    var card = el('div', 'status-card');
    card.addEventListener('click', function () { switchTab(opts.tabName); });
    var head = el('div', 'status-card-head');
    head.appendChild(el('div', 'status-card-title', opts.title));
    head.appendChild(el('div', 'status-dot status-dot-' + opts.status));
    card.appendChild(head);
    var valueRow = el('div', 'status-value-row');
    valueRow.appendChild(el('div', 'status-value', String(opts.value)));
    if (opts.delta !== null && opts.delta !== undefined) {
      var up = opts.delta > 0.5, down = opts.delta < -0.5;
      var badDirection = opts.deltaInverse ? down : up; // which direction counts as "worse"
      var goodDirection = opts.deltaInverse ? up : down;
      var deltaClass = badDirection ? 'status-delta-up' : goodDirection ? 'status-delta-down' : 'status-delta-flat';
      var arrow = up ? '▲' : down ? '▼' : '→';
      valueRow.appendChild(el('div', 'status-delta ' + deltaClass, arrow + ' ' + Math.abs(opts.delta).toFixed(1) + '% so kỳ trước'));
    }
    card.appendChild(valueRow);
    card.appendChild(el('div', 'status-note', opts.note));
    container.appendChild(card);
  }

  // ---- Tab 0: Tổng quan (executive overview) ----
  // Always compares the last TWO FULLY COMPLETED weeks — never the
  // in-progress current week — so a check done on day 3 of a new week never
  // shows a misleadingly "low" number just because the week isn't over yet.
  function renderOverview() {
    var c = document.getElementById('panel-overview');
    var wk = lastCompleteWeekKeys();
    c.appendChild(el('div', 'exec-summary-note',
      'So sánh 2 tuần đã kết thúc trọn vẹn gần nhất (' + weekLabelClient(wk.previous) + ' → ' + weekLabelClient(wk.current) +
      '), không tính tuần đang chạy dở. Bấm vào từng thẻ để xem chi tiết. 🟢 ổn định · 🟡 cần theo dõi · 🔴 cần xử lý ngay.'));
    var grid = el('div', 'status-grid');

    (function () {
      var curr = findByKey(DATA.cancelRefund.weekly, wk.current);
      var prev = findByKey(DATA.cancelRefund.weekly, wk.previous);
      var currCount = curr ? curr.count : 0;
      var delta = computeDelta(currCount, prev ? prev.count : 0);
      var status = delta !== null && delta >= 20 ? 'critical' : (delta !== null && delta > 0 ? 'warning' : 'good');
      var note = curr || prev
        ? ('Tổng $' + ((curr && curr.cost) || 0).toFixed(0) + ' refund/cancel tuần vừa qua.' +
           (delta !== null && delta > 10 ? ' Tăng đáng kể so tuần trước — nên rà lại nguyên nhân.' : ''))
        : 'Chưa đủ dữ liệu tuần để so sánh.';
      renderStatusCard(grid, { tabName: 'cancelRefund', title: 'Cancel / Refund', status: status, value: currCount, delta: delta, note: note });
    })();

    (function () {
      var cd = DATA.channelPerformance || { weeks: [], channels: {} };
      var latestIdx = cd.weeks.length - 1;
      var failing = [];
      if (latestIdx >= 0) {
        CP_CHANNEL_ORDER.forEach(function (key) {
          var ch = { metrics: CP_TARGETS[key] || [], accounts: (cd.channels[key] || {}).accounts || [] };
          ch.accounts.forEach(function (a) {
            var hasData = ch.metrics.some(function (m) { return cpValAt(a, m.key, latestIdx) !== null; });
            if (hasData && !cpAccountFullyPasses(ch.metrics, a, latestIdx)) failing.push({ account: a.account, channel: key });
          });
        });
      }
      var status = failing.length > 0 ? 'critical' : 'good';
      var note = failing.length
        ? (failing.length + ' account chưa đạt chuẩn — vd ' + failing[0].account + ' (' + failing[0].channel + ').')
        : 'Toàn bộ account đang đạt chuẩn.';
      renderStatusCard(grid, { tabName: 'channelPerformance', title: 'Channel Performance', status: status, value: failing.length, note: note });
    })();

    (function () {
      var curr = findByKey(DATA.fbaIssues.weekly, wk.current);
      var prev = findByKey(DATA.fbaIssues.weekly, wk.previous);
      var currCount = curr ? curr.count : 0;
      var delta = computeDelta(currCount, prev ? prev.count : 0);
      var status = delta !== null && delta >= 20 ? 'critical' : (delta !== null && delta > 0 ? 'warning' : 'good');
      var note = (curr || prev) ? (currCount + ' issue tuần vừa qua.') : 'Chưa đủ dữ liệu tuần để so sánh.';
      renderStatusCard(grid, { tabName: 'fbaIssues', title: 'FBA Issues', status: status, value: currCount, delta: delta, note: note });
    })();

    (function () {
      var kpis = DATA.paypalDispute.kpis;
      var totalCases = kpis[0].value, winRateStr = kpis[1].value, backlog = kpis[2].value;
      var winRateNum = parseFloat(winRateStr);
      var status = backlog > 0 ? 'critical' : (isNaN(winRateNum) || winRateNum < 50 ? 'warning' : 'good');
      var note = (backlog > 0 ? (backlog + ' case quá hạn chưa xử lý — cần theo sát. ') : '') +
        totalCases + ' case tổng (60 ngày) · Win rate ' + winRateStr + '.';
      renderStatusCard(grid, { tabName: 'paypalDispute', title: 'PayPal Dispute', status: status, value: backlog, note: note });
    })();

    (function () {
      var channels = DATA.ordersByChannel.channels;
      function totalFor(row) { return row ? channels.reduce(function (s, ch) { return s + (row[ch] || 0); }, 0) : 0; }
      var curr = findByKey(DATA.ordersByChannel.weeklyByChannel, wk.current);
      var prev = findByKey(DATA.ordersByChannel.weeklyByChannel, wk.previous);
      var currTotal = totalFor(curr);
      var delta = computeDelta(currTotal, totalFor(prev));
      var status = delta !== null && delta <= -20 ? 'warning' : 'good';
      var note = (curr || prev) ? (currTotal + ' đơn tuần vừa qua trên ' + channels.length + ' kênh.') : 'Chưa đủ dữ liệu tuần để so sánh.';
      renderStatusCard(grid, { tabName: 'ordersByChannel', title: 'Orders theo kênh', status: status, value: currTotal, delta: delta, note: note, deltaInverse: true });
    })();

    c.appendChild(grid);
  }

  function renderAll() {
    document.querySelectorAll('.panel').forEach(function (p) { p.innerHTML = ''; });
    renderOverview();
    renderCancelRefund();
    renderChannelPerformance();
    renderFbaIssues();
    renderPaypalDispute();
    renderOrdersByChannel();
  }

  renderAll();
})();
`;
