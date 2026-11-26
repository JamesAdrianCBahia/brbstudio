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

