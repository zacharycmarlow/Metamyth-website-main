'use strict';

// Progressive enhancement: the full packet and both budgets are readable without JS.
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
function selectAllocation(tab, focus = false) {
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    if (panel) panel.hidden = !active;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectAllocation(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectAllocation(tabs[next], true);
    }
  });
});
if (tabs.length) selectAllocation(tabs[0]);
document.querySelectorAll('[data-open-ecosystem]').forEach(link => {
  link.addEventListener('click', () => {
    if (tabs[1]) selectAllocation(tabs[1]);
  });
});

const scenarios = {
  floor: {
    title: 'The Floor case', revenue: '$712K', time: '~5.7 years', multiple: '1.80×',
    description: 'The source’s lower-growth case: repayment takes longer and the total multiple rises. This is not a worst-case guarantee; poorer performance or business failure can result in loss of capital.'
  },
  target: {
    title: 'The Target case', revenue: '$1.18M', time: '~3.8 years', multiple: '1.51×',
    description: 'The source’s central case: repayment in about 3.8 years, with cash beginning to return quarterly after the build period. Timing depends on actual free cash flow.'
  },
  stretch: {
    title: 'The Stretch case', revenue: '$1.69M', time: '~2.8 years', multiple: '1.38×',
    description: 'The source’s higher-growth case: faster repayment lowers the total multiple. This outcome depends on demand and margins that may not materialize.'
  }
};
const scenarioButtons = Array.from(document.querySelectorAll('[data-scenario]'));
scenarioButtons.forEach(button => button.addEventListener('click', () => {
  const scenario = scenarios[button.dataset.scenario];
  if (!scenario) return;
  scenarioButtons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.scenario === button.dataset.scenario)));
  ['title', 'description', 'revenue', 'time', 'multiple'].forEach(key => {
    const target = document.getElementById(`scenario-${key}`);
    if (target) target.textContent = scenario[key];
  });
}));

// Native HTML/SVG charts: no remote runtime, no invented financial inputs.
// Allocation values come directly from the complete, no-JS source tables.
const allocationColors = ['#61A9BD', '#CED14E', '#44986D', '#DD83C9', '#1F74AD', '#E98E2E', '#9267C6'];
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
document.querySelectorAll('[data-allocation]').forEach(chart => {
  const panel = chart.closest('.fund-panel');
  const table = panel?.querySelector('table');
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tbody tr')).map(row => ({
    name: row.cells[0].textContent.trim(),
    value: Number(row.cells[1].textContent.replace(/[^0-9.]/g, '')) * 1000
  }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total || rows.some(row => !Number.isFinite(row.value) || row.value <= 0)) return;
  const stack = document.createElement('div');
  stack.className = 'allocation-stack';
  stack.setAttribute('role', 'img');
  stack.setAttribute('aria-label', `Draft ${chart.dataset.allocation} capital allocation, ${usd.format(total)} total. Proportional segments; exact figures in the selectable key and source table.`);
  const key = document.createElement('div');
  key.className = 'allocation-key';
  key.setAttribute('role', 'group');
  key.setAttribute('aria-label', 'Inspect an allocation category');
  const readout = document.createElement('p');
  readout.className = 'allocation-readout';
  readout.setAttribute('role', 'status');
  readout.setAttribute('aria-live', 'polite');
  readout.textContent = 'Select a category to inspect its share of this allocation.';
  const segments = [];
  const buttons = [];
  rows.forEach((row, index) => {
    const color = allocationColors[index];
    const share = row.value / total * 100;
    const segment = document.createElement('span');
    segment.style.flex = String(row.value);
    segment.style.setProperty('--part', color);
    segment.setAttribute('aria-hidden', 'true');
    stack.append(segment);
    segments.push(segment);
    const button = document.createElement('button');
    button.type = 'button';
    button.style.setProperty('--part', color);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${row.name}: ${usd.format(row.value)}, ${share.toFixed(1)} percent of ${usd.format(total)}. Inspect allocation.`);
    const label = document.createElement('span');
    label.textContent = row.name;
    const amount = document.createElement('strong');
    amount.textContent = usd.format(row.value);
    button.append(label, amount);
    button.addEventListener('click', () => {
      const selected = button.getAttribute('aria-pressed') !== 'true';
      buttons.forEach(item => item.setAttribute('aria-pressed', String(selected && item === button)));
      segments.forEach((item, itemIndex) => item.classList.toggle('is-muted', selected && itemIndex !== index));
      readout.textContent = selected
        ? `${row.name} · ${usd.format(row.value)} · ${share.toFixed(1)}% of the ${usd.format(total)} ${chart.dataset.allocation} allocation.`
        : 'All categories shown. Select a category to inspect its share.';
    });
    buttons.push(button);
    key.append(button);
  });
  const note = document.createElement('p');
  note.className = 'viz-note';
  note.textContent = `Parts of the ${usd.format(total)} ${chart.dataset.allocation} budget. Segment widths show exact shares; displayed percentages are rounded. Draft use of funds.`;
  chart.append(stack, key, readout, note);
  // Preserve the full table, progressively disclosing it only after chart creation.
  const details = document.createElement('details');
  details.className = 'budget-source';
  const summary = document.createElement('summary');
  summary.textContent = 'Read the source allocation table';
  table.before(details);
  details.append(summary, table);
  chart.hidden = false;
});
const revenueChart = document.getElementById('revenue-chart');
if (revenueChart) revenueChart.hidden = false;

const repaymentYear = document.getElementById('repayment-year');
const repaymentOutput = document.getElementById('repayment-output');
const repaymentMarker = document.getElementById('repayment-marker');
const repaymentAnchors = [[3, 1.4], [5, 1.7], [7, 2.0], [10, 2.5]];
function updateRepayment() {
  if (!repaymentYear || !repaymentOutput || !repaymentMarker) return;
  const year = Number(repaymentYear.value);
  const upperIndex = repaymentAnchors.findIndex(anchor => anchor[0] >= year);
  const upper = repaymentAnchors[Math.max(0, upperIndex)];
  const lower = repaymentAnchors[Math.max(0, upperIndex - 1)];
  const multiple = upper[0] === lower[0] ? upper[1]
    : lower[1] + (year - lower[0]) / (upper[0] - lower[0]) * (upper[1] - lower[1]);
  const yearLabel = Number.isInteger(year) ? String(year) : year.toFixed(1);
  const isAnchor = repaymentAnchors.some(anchor => anchor[0] === year);
  repaymentOutput.textContent = `Year ${yearLabel} · ${multiple.toFixed(2)}×${isAnchor ? '' : ' (interpolated)'}`;
  repaymentYear.setAttribute('aria-valuetext', `Full repayment in year ${yearLabel}: ${multiple.toFixed(2)} times principal, ${isAnchor ? 'stated draft anchor' : 'interpolated draft illustration, not a forecast'}`);
  repaymentMarker.setAttribute('cx', String(65 + (year - 3) / 7 * 640));
  repaymentMarker.setAttribute('cy', String(220 - (multiple - 1.2) / 1.3 * (220 - 13.33)));
  document.querySelectorAll('[data-repayment-year]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.repaymentYear) === year));
  });
}
if (repaymentYear) {
  repaymentYear.addEventListener('input', updateRepayment);
  document.querySelectorAll('[data-repayment-year]').forEach(button => {
    button.addEventListener('click', () => {
      repaymentYear.value = button.dataset.repaymentYear;
      updateRepayment();
    });
  });
  updateRepayment();
  document.getElementById('repayment-viz').hidden = false;
}

const search = document.getElementById('packet-search');
const documents = Array.from(document.querySelectorAll('[data-document]'));
function filterDocuments() {
  if (!search) return;
  const query = search.value.trim().toLowerCase();
  let count = 0;
  documents.forEach(item => {
    const match = !query || `${item.dataset.document} ${item.textContent}`.toLowerCase().includes(query);
    item.hidden = !match;
    if (match) count++;
  });
  const empty = document.getElementById('packet-empty');
  const library = document.getElementById('packet-library');
  const status = document.getElementById('search-status');
  if (empty) empty.hidden = count > 0;
  if (library) library.hidden = count === 0;
  if (status) status.textContent = query ? `${count} of 4 documents match.` : '';
}
if (search) search.addEventListener('input', filterDocuments);
document.getElementById('clear-search')?.addEventListener('click', () => {
  if (search) { search.value = ''; filterDocuments(); search.focus(); }
});

const progress = document.querySelector('.progress');
let framePending = false;
function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${available > 0 ? Math.min(1, window.scrollY / available) : 0})`;
  framePending = false;
}
window.addEventListener('scroll', () => {
  if (!framePending) { framePending = true; window.requestAnimationFrame(updateProgress); }
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
if ('IntersectionObserver' in window) {
  const links = Array.from(document.querySelectorAll('.room-nav a'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('.chapter[id]').forEach(section => observer.observe(section));
}
document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
// Keep the contents available without making mobile readers scroll past it first.
if (window.matchMedia('(max-width: 767px)').matches) {
  document.querySelectorAll('.contents details').forEach(contents => { contents.open = false; });
}
