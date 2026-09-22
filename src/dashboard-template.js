// Renders the full dashboard page as a single HTML string. All chart drawing
// happens in the viewer's browser (inline <script> below) — the Worker only
// ever serves this string from KV, it doesn't run a headless browser itself.

export function renderDashboard(data) {
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
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
      <span class="updated">Cập nhật: ${updated}</span>
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
  function renderChannelPerformance() {
    var c = document.getElementById('panel-channelPerformance');
    var d = DATA.channelPerformance;
    renderKpis(c, d.kpis);

    if (d.alerts.length) {
      var alertCard = el('div', 'card');
      alertCard.appendChild(el('h3', null, 'Cảnh báo vượt ngưỡng'));
      d.alerts.forEach(function (a) {
        var row = el('div', 'bar-list-row');
        row.style.gridTemplateColumns = '140px 1fr 100px';
        row.appendChild(el('div', 'bar-list-label', a.account));
        row.appendChild(el('div', null, a.metric + ' ' + (a.direction === 'below' ? '<' : '>') + ' ngưỡng'));
        var badge = el('span', 'badge badge-critical', (a.value * 100).toFixed(2) + '%');
        row.appendChild(badge);
        alertCard.appendChild(row);
      });
      c.appendChild(alertCard);
    }

    var grid = el('div', 'grid-3');
    d.metricList.forEach(function (metric) {
      var points = d.monthlyByMetric[metric];
      renderLineChart(grid, metric, points);
    });
    c.appendChild(grid);

    var cols = [{ label: 'Account', key: 'account' }, { label: 'Channel', key: 'channel' }]
      .concat(d.metricList.map(function (m) { return { label: m, render: function (r) { return fmtPct(r.metrics[m]); } }; }));
    renderTable(c, 'Snapshot mới nhất theo account', cols, d.accountTable);
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
      var alerts = DATA.channelPerformance.alerts;
      var status = alerts.length > 0 ? 'critical' : 'good';
      var note = alerts.length
        ? (alerts.length + ' cảnh báo vượt ngưỡng — vd ' + alerts[0].account + ': ' + alerts[0].metric + '.')
        : 'Không có account nào vượt ngưỡng an toàn.';
      renderStatusCard(grid, { tabName: 'channelPerformance', title: 'Channel Performance', status: status, value: alerts.length, note: note });
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
