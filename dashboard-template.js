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
<title>SL Dashboard</title>
<style>${STYLE}</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand">SL Dashboard</div>
    <div class="topbar-right">
      <span class="updated">Cập nhật: ${updated}</span>
      <button id="themeToggle" class="btn-ghost" title="Đổi giao diện sáng/tối">🌓</button>
    </div>
  </header>

  <nav class="tabs" id="tabs">
    <button class="tab active" data-tab="cancelRefund">Cancel/Refund</button>
    <button class="tab" data-tab="channelPerformance">Channel Performance</button>
    <button class="tab" data-tab="fbaIssues">FBA Issues</button>
    <button class="tab" data-tab="paypalDispute">PayPal Dispute</button>
    <button class="tab" data-tab="ordersByChannel">Orders theo kênh</button>
  </nav>

  <main id="panels">
    <section class="panel active" id="panel-cancelRefund"></section>
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
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
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

  // ---- Tab 1: Cancel/Refund ----
  function renderCancelRefund() {
    var c = document.getElementById('panel-cancelRefund');
    var d = DATA.cancelRefund;
    renderKpis(c, d.kpis);
    var cats = d.monthly.map(function (m) { return m.label; });
    renderGroupedBarChart(c, 'Volume theo tháng', cats, [
      { label: 'Refund', data: d.monthly.map(function (m) { return m.refund; }) },
      { label: 'Cancel', data: d.monthly.map(function (m) { return m.cancel; }) },
    ]);
    var grid = el('div', 'grid-2');
    renderBarList(grid, 'Theo kênh', d.breakdowns.byChannel, 'count');
    renderBarList(grid, 'Theo store', d.breakdowns.byStore, 'count');
    c.appendChild(grid);
    var grid2 = el('div', 'grid-2');
    renderBarList(grid2, 'Theo sản phẩm', d.breakdowns.byProduct, 'count');
    renderBarList(grid2, 'Theo CS agent', d.breakdowns.byAgent, 'count');
    c.appendChild(grid2);
    renderTable(c, 'Top lý do', [{ label: 'Lý do', key: 'reason' }, { label: 'Số lần', key: 'count' }], d.topReasons);
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

  function renderAll() {
    document.querySelectorAll('.panel').forEach(function (p) { p.innerHTML = ''; });
    renderCancelRefund();
    renderChannelPerformance();
    renderFbaIssues();
    renderPaypalDispute();
    renderOrdersByChannel();
  }

  renderAll();
})();
`;
