function readFilters() {
  const params = new URLSearchParams(window.location.search);
  const today = new Date();

  return {
    from: params.get('from') || toMonthKey(new Date(today.getFullYear(), 0, 1)),
    to: params.get('to') || toMonthKey(today),
    serviceId: params.get('serviceId') || '',
  };
}

function currentFilters() {
  return {
    from: elements.fromMonth.value,
    to: elements.toMonth.value,
    serviceId: elements.serviceSelect.value,
  };
}

function toQuery({ from, to, serviceId }) {
  const params = new URLSearchParams({ from, to });
  if (serviceId) params.set('serviceId', serviceId);

  return params.toString();
}


function renderSummary({ summary }) {
  elements.stats.forEach((element) => {
    element.textContent = formatPeso(summary[element.dataset.stat]);
  });
}

function createIncomeBar({ month, income }, highest, currentMonth, showYear) {
  const bar = elements.incomeTemplate.content.firstElementChild.cloneNode(true);
  const date = fromMonthKey(month);
  const label = showYear
    ? `${shortMonthFormat.format(date)} '${String(date.getFullYear()).slice(2)}`
    : shortMonthFormat.format(date);

  bar.style.setProperty('--percent', (income / highest) * 100);
  bar.classList.toggle('income-bar--current', month === currentMonth);
  bar.title = `${longMonthFormat.format(date)}: ${formatPeso(income)}`;

  bar.querySelector('.income-bar__value').textContent = income > 0 ? formatChartAmount(income) : '';
  bar.querySelector('.income-bar__month').textContent = label;

  return bar;
}


function renderIncome({ monthlyIncome }) {
  const highest = Math.max(...monthlyIncome.map((entry) => entry.income), 1);
  const currentMonth = toMonthKey(new Date());
  const showYear = monthlyIncome[0].month.slice(0, 4) !== monthlyIncome.at(-1).month.slice(0, 4);
  const hasIncome = monthlyIncome.some((entry) => entry.income > 0);

  elements.incomeBars.replaceChildren(
    ...monthlyIncome.map((entry) => createIncomeBar(entry, highest, currentMonth, showYear))
  );

  elements.incomeStatus.textContent = 'No payments received in this period.';
  elements.incomeStatus.hidden = hasIncome;
}

async function loadReport() {
  const requestId = ++latestRequest;
  const filters = currentFilters();

  elements.error.hidden = true;
  elements.status.textContent = 'Loading report...';
  elements.status.hidden = false;

  try {
    const report = await getJson(`${API_BASE}?${toQuery(filters)}`);

    if (requestId !== latestRequest) return;

    renderReport(report, filters);
    updateMenu(filters);
    window.history.replaceState(null, '', `${PAGE_URL}?${toQuery(filters)}`);
  } catch (error) {
    if (requestId !== latestRequest) return;

    console.error('Could not load report:', error);
    elements.content.hidden = true;
    elements.status.hidden = true;
    showError(Object.values(error.fieldErrors ?? {})[0] || error.message);
  }
}

elements.filters.addEventListener('change', () => {
  const { from, to } = currentFilters();

  if (from && to) loadReport();
});

elements.filters.addEventListener('submit', (event) => event.preventDefault());

elements.reportButton.addEventListener('click', (event) => {
  event.preventDefault();
  const expanded = elements.reportButton.getAttribute('aria-expanded') === 'true';
  elements.reportButton.setAttribute('aria-expanded', String(!expanded));
  elements.menu.hidden = expanded;
  if (!expanded) elements.menu.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

async function init() {
  const filters = readFilters();

  elements.fromMonth.value = filters.from;
  elements.toMonth.value = filters.to;

  await loadServices();

  const isKnownService = services.some((service) => String(service.id) === filters.serviceId);
  elements.serviceSelect.value = isKnownService ? filters.serviceId : '';

  loadReport();
}

init();