import { getJson } from './admin-api.js';

const API_BASE = '/api/admin/calendar';
const KEEP_SELECTION_AREAS = '.calendar, .day-panel, .blocked-panel, .sidebar, dialog, .toast';

const monthTitleFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const longDateFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const shortMonthFormat = new Intl.DateTimeFormat('en-US', { month: 'short' });
const monthNames = Array.from({ length: 12 }, (_, index) => shortMonthFormat.format(new Date(2000, index, 1)));

const elements = {
  title: document.getElementById('calendarTitle'),
  grid: document.getElementById('calendarGrid'),
  previousMonth: document.getElementById('previousMonth'),
  nextMonth: document.getElementById('nextMonth'),
  monthPickerButton: document.getElementById('monthPickerButton'),
  monthPicker: document.getElementById('monthPicker'),
  monthPickerGrid: document.getElementById('monthPickerGrid'),
  pickerYear: document.getElementById('pickerYear'),
  previousYear: document.getElementById('previousYear'),
  nextYear: document.getElementById('nextYear'),
  dayTitle: document.getElementById('dayTitle'),
  bookingList: document.getElementById('bookingList'),
  bookingEmpty: document.getElementById('bookingEmpty'),
  bookingTemplate: document.getElementById('bookingItemTemplate'),
  dayNote: document.getElementById('dayNote'),
  toggleBlock: document.getElementById('toggleBlockButton'),
  blockedList: document.getElementById('blockedList'),
  blockedEmpty: document.getElementById('blockedEmpty'),
  blockedTemplate: document.getElementById('blockedItemTemplate'),
  blockDialog: document.getElementById('blockDialog'),
  blockDialogMessage: document.getElementById('blockDialogMessage'),
  confirmBlock: document.getElementById('confirmBlockButton'),
  toast: document.getElementById('toast'),
};

const pad = (number) => String(number).padStart(2, '0');

const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromIsoDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatLongDate = (isoDate) => longDateFormat.format(fromIsoDate(isoDate));

const now = new Date();
const today = toIsoDate(now);

const state = {
  year: now.getFullYear(),
  month: now.getMonth(),
  selectedDate: today,
  bookedDates: new Set(),
  blockedDates: new Set(),
  day: null,
  busy: false,
  pickerOpen: false,
  pickerYear: now.getFullYear(),
};

let latestMonthRequest = 0;
let latestDayRequest = 0;
let toastTimer = null;

const monthKey = () => `${state.year}-${pad(state.month + 1)}`;

function describeDay(isoDate) {
  const parts = [formatLongDate(isoDate)];

  if (isoDate === today) parts.push('today');
  if (isoDate < today) parts.push('past date');
  if (state.blockedDates.has(isoDate)) parts.push('unavailable');
  if (state.bookedDates.has(isoDate)) parts.push('has bookings');

  return parts.join(', ');
}

function createDayCell(day) {
  const isoDate = `${monthKey()}-${pad(day)}`;
  const cell = document.createElement('button');
  const number = document.createElement('span');

  cell.type = 'button';
  cell.className = 'calendar__day';
  cell.dataset.date = isoDate;
  cell.setAttribute('aria-label', describeDay(isoDate));
  cell.setAttribute('aria-pressed', String(isoDate === state.selectedDate));

  number.className = 'calendar__number';
  number.textContent = day;
  cell.append(number);

  cell.classList.toggle('calendar__day--past', isoDate < today);
  cell.classList.toggle('calendar__day--today', isoDate === today);
  cell.classList.toggle('calendar__day--unavailable', state.blockedDates.has(isoDate));
  cell.classList.toggle('calendar__day--selected', isoDate === state.selectedDate);

  if (state.bookedDates.has(isoDate)) {
    const dot = document.createElement('span');
    dot.className = 'calendar__dot';
    cell.append(dot);
  }

  return cell;
}

function createEmptyCell() {
  const cell = document.createElement('span');
  cell.className = 'calendar__day calendar__day--empty';
  cell.setAttribute('aria-hidden', 'true');
  return cell;
}

function renderCalendar() {
  const leadingBlanks = new Date(state.year, state.month, 1).getDay();
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingBlanks + 1;
    return day >= 1 && day <= daysInMonth ? createDayCell(day) : createEmptyCell();
  });

  elements.title.textContent = monthTitleFormat.format(new Date(state.year, state.month, 1));
  elements.grid.replaceChildren(...cells);
}

async function loadMonth() {
  const requestId = ++latestMonthRequest;

  try {
    const overview = await getJson(`${API_BASE}/month?month=${monthKey()}`);
    if (requestId !== latestMonthRequest) return;

    state.bookedDates = new Set(overview.bookedDates);
    state.blockedDates = new Set(overview.blockedDates);
    renderCalendar();
  } catch (error) {
    if (requestId === latestMonthRequest) showToast(error.message, 'error');
  }
}

function goToMonth(year, month) {
  state.year = year;
  state.month = month;
  state.bookedDates = new Set();
  state.blockedDates = new Set();

  if (state.selectedDate && !state.selectedDate.startsWith(monthKey())) {
    clearSelection();
  } else {
    renderCalendar();
  }

  loadMonth();
}

function stepMonth(step) {
  const target = new Date(state.year, state.month + step, 1);
  goToMonth(target.getFullYear(), target.getMonth());
}

function renderMonthPicker() {
  elements.pickerYear.textContent = state.pickerYear;

  const buttons = monthNames.map((name, index) => {
    const button = document.createElement('button');
    const isShown = state.pickerYear === state.year && index === state.month;
    const isCurrent = state.pickerYear === now.getFullYear() && index === now.getMonth();

    button.type = 'button';
    button.className = 'month-picker__month';
    button.dataset.month = index;
    button.textContent = name;
    button.setAttribute('aria-pressed', String(isShown));
    button.classList.toggle('month-picker__month--selected', isShown);
    button.classList.toggle('month-picker__month--current', isCurrent && !isShown);

    return button;
  });

  elements.monthPickerGrid.replaceChildren(...buttons);
}

function openMonthPicker() {
  state.pickerOpen = true;
  state.pickerYear = state.year;

  renderMonthPicker();
  elements.monthPicker.hidden = false;
  elements.monthPickerButton.setAttribute('aria-expanded', 'true');

  const target = elements.monthPickerGrid.querySelector('[aria-pressed="true"]') ?? elements.monthPickerGrid.firstElementChild;
  target.focus();
}

function closeMonthPicker({ restoreFocus = false } = {}) {
  state.pickerOpen = false;
  elements.monthPicker.hidden = true;
  elements.monthPickerButton.setAttribute('aria-expanded', 'false');

  if (restoreFocus) elements.monthPickerButton.focus();
}

function shiftPickerYear(step) {
  state.pickerYear += step;
  renderMonthPicker();
}

elements.previousMonth.addEventListener('click', () => stepMonth(-1));
elements.nextMonth.addEventListener('click', () => stepMonth(1));

elements.grid.addEventListener('click', (event) => {
  const cell = event.target.closest('button[data-date]');
  if (!cell) return;

  if (cell.dataset.date === state.selectedDate) clearSelection();
  else selectDate(cell.dataset.date);
});

elements.monthPickerButton.addEventListener('click', () => {
  if (state.pickerOpen) closeMonthPicker();
  else openMonthPicker();
});

elements.previousYear.addEventListener('click', () => shiftPickerYear(-1));
elements.nextYear.addEventListener('click', () => shiftPickerYear(1));

elements.monthPickerGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-month]');
  if (!button) return;

  goToMonth(state.pickerYear, Number(button.dataset.month));
  closeMonthPicker({ restoreFocus: true });
});

elements.toggleBlock.addEventListener('click', handleToggleBlock);

elements.confirmBlock.addEventListener('click', () => {
  elements.blockDialog.close();
  blockDate(state.selectedDate);
});

elements.blockedList.addEventListener('click', (event) => {
  const dateButton = event.target.closest('.blocked-item__date');
  const removeButton = event.target.closest('.blocked-item__remove');

  if (dateButton) {
    const target = fromIsoDate(dateButton.dataset.date);

    goToMonth(target.getFullYear(), target.getMonth());
    selectDate(dateButton.dataset.date);
  }

  if (removeButton) unblockDate(removeButton.dataset.date);
});

elements.blockDialog.addEventListener('click', (event) => {
  if (event.target === elements.blockDialog || event.target.closest('[data-dialog-close]')) {
    elements.blockDialog.close();
  }
});

document.addEventListener('click', (event) => {
  const path = event.composedPath();
  const isInside = (selector) => path.some((node) => node instanceof Element && node.matches(selector));

  if (state.pickerOpen && !isInside('.month-picker')) {
    closeMonthPicker();
    return;
  }

  if (state.selectedDate && !isInside(KEEP_SELECTION_AREAS)) clearSelection();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.pickerOpen) closeMonthPicker({ restoreFocus: true });
});

renderCalendar();
loadMonth();
