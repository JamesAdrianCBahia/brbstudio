import { getJson, postJson } from './api.js';
import { startAccountPage } from './account-page.js';
import { createCalendar } from './calendar-grid.js';
import { formatLongDate, formatPeso, formatTime } from './format.js';
import { setSubmitting, showAlert, showNetworkError } from './form-helpers.js';

const LOGIN_PAGE = 'login.html';
const OPEN_MINUTES = 7 * 60;
const CLOSE_MINUTES = 19 * 60;
const STEP_MINUTES = 30;
const DEFAULT_FROM = '09:00';
const DEFAULT_TO = '11:00';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const panels = [...document.querySelectorAll('.booking-step')];
const stepperSteps = document.querySelectorAll('.stepper__step');
const stepTitle = document.getElementById('stepTitle');
const stepSubtitle = document.getElementById('stepSubtitle');

const serviceStatus = document.getElementById('serviceStatus');
const serviceOptions = document.getElementById('serviceOptions');
const optionTemplate = document.getElementById('serviceOptionTemplate');
const serviceContinue = document.getElementById('serviceContinue');

const scheduleError = document.getElementById('scheduleError');
const scheduleContinue = document.getElementById('scheduleContinue');
const timeFrom = document.getElementById('timeFrom');
const timeTo = document.getElementById('timeTo');
const bookedNotice = document.getElementById('bookedNotice');
const bookedList = document.getElementById('bookedList');

const summaryDetails = document.getElementById('summaryDetails');
const summaryServices = document.getElementById('summaryServices');
const summaryDate = document.getElementById('summaryDate');
const summaryTime = document.getElementById('summaryTime');
const summaryTotal = document.getElementById('summaryTotal');
const submitError = document.getElementById('submitError');
const submitButton = document.getElementById('submitBooking');
const summaryBack = document.getElementById('summaryBack');
const lockedContinue = document.getElementById('lockedContinue');
const requestSent = document.getElementById('requestSent');

const state = {
  services: [],
  selectedIds: new Set(),
  date: null,
  bookedOnDate: [],
};

let bookedRequest = 0;

const pad = (value) => String(value).padStart(2, '0');
const toTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function toMinutes(text) {
  const [hours, minutes] = text.split(':').map(Number);
  return hours * 60 + minutes;
}

const selectedServices = () => state.services.filter((service) => state.selectedIds.has(service.id));

function goToStep(step) {
  const current = panels.find((panel) => Number(panel.dataset.step) === step);

  panels.forEach((panel) => {
    panel.hidden = panel !== current;
  });
  stepperSteps.forEach((item) => {
    item.classList.toggle('is-reached', Number(item.dataset.step) <= step);
  });

  stepTitle.textContent = current.dataset.title;
  stepSubtitle.textContent = current.dataset.subtitle;

  if (step === 2) renderBookedNotice();
  if (step === 3) renderSummary();

  window.scrollTo({ top: 0 });
}

function buildOption(service) {
  const item = optionTemplate.content.firstElementChild.cloneNode(true);
  const image = item.querySelector('.service-option__image');
  const input = item.querySelector('.service-option__input');

  input.value = service.id;
  input.checked = state.selectedIds.has(service.id);
  item.querySelector('.service-option__name').textContent = service.name;
  item.querySelector('.service-option__price').textContent = formatPeso(service.price);

  if (service.imageUrl) {
    image.src = service.imageUrl;
    image.alt = service.name;
  } else {
    image.remove();
  }

  return item;
}

function showServiceStatus(text) {
  serviceStatus.textContent = text;
  serviceStatus.hidden = false;
}

async function loadServices() {
  try {
    const { ok, data } = await getJson('/api/services');

    if (!ok) {
      showServiceStatus('Services could not be loaded. Please refresh the page.');
      return;
    }

    if (data.length === 0) {
      showServiceStatus('No services are available right now.');
      return;
    }

    state.services = data;

    const preselected = Number(new URLSearchParams(window.location.search).get('service'));
    if (data.some((service) => service.id === preselected)) state.selectedIds.add(preselected);

    serviceOptions.replaceChildren(...data.map(buildOption));
    serviceContinue.disabled = state.selectedIds.size === 0;
    serviceStatus.hidden = true;
  } catch {
    showServiceStatus('Unable to reach the server. Please check your connection and try again.');
  }
}

function buildTimeOptions(select, fromMinutes, toMinutesLimit, selectedValue) {
  const options = [];

  for (let minutes = fromMinutes; minutes <= toMinutesLimit; minutes += STEP_MINUTES) {
    const option = document.createElement('option');

    option.value = toTime(minutes);
    option.textContent = formatTime(option.value);
    options.push(option);
  }

  select.replaceChildren(...options);
  select.value = selectedValue;
}

function renderEndTimes(preferred) {
  const start = toMinutes(timeFrom.value);
  const preferredMinutes = toMinutes(preferred);
  const target = preferredMinutes > start ? preferredMinutes : Math.min(start + 120, CLOSE_MINUTES);

  buildTimeOptions(timeTo, start + STEP_MINUTES, CLOSE_MINUTES, toTime(target));
}

function renderBookedNotice() {
  const names = new Set(selectedServices().map((service) => service.name));
  const rows = state.bookedOnDate.filter(({ serviceName }) => names.has(serviceName));

  bookedList.replaceChildren(
    ...rows.map(({ serviceName, timeLabel }) => {
      const item = document.createElement('li');

      item.textContent = `${serviceName}: ${timeLabel}`;
      return item;
    })
  );
  bookedNotice.hidden = rows.length === 0;
}

async function loadBookedOnDate(iso) {
  const request = ++bookedRequest;

  state.date = iso;
  scheduleError.hidden = true;

  try {
    const { ok, data } = await getJson(`/api/calendar/day?date=${iso}`);
    if (request !== bookedRequest) return;

    state.bookedOnDate = ok ? data.booked : [];
  } catch {
    if (request !== bookedRequest) return;
    state.bookedOnDate = [];
  }

  renderBookedNotice();
}

function renderSummary() {
  const services = selectedServices();
  const total = services.reduce((sum, service) => sum + service.price, 0);

  summaryServices.replaceChildren(
    ...services.map((service) => {
      const item = document.createElement('li');

      item.textContent = service.name;
      return item;
    })
  );
  summaryDate.textContent = formatLongDate(state.date);
  summaryTime.textContent = `${formatTime(timeFrom.value)} - ${formatTime(timeTo.value)}`;
  summaryTotal.textContent = formatPeso(total);
}

function readErrorMessage(data) {
  return Object.values(data.errors ?? {})[0] || data.message || GENERIC_ERROR_MESSAGE;
}

function showRequestSent() {
  summaryDetails.hidden = true;
  requestSent.hidden = false;
  summaryBack.hidden = true;
  submitButton.hidden = true;
  lockedContinue.hidden = false;
}

async function submitBooking() {
  submitError.hidden = true;
  setSubmitting(submitButton, true);

  const payload = {
    serviceIds: [...state.selectedIds],
    eventDate: state.date,
    startTime: timeFrom.value,
    endTime: timeTo.value,
  };

  try {
    const response = await postJson('/api/bookings', payload);

    if (response.ok) {
      showRequestSent();
      return;
    }

    if (response.status === 401) {
      window.location.assign(LOGIN_PAGE);
      return;
    }

    showAlert(submitError, readErrorMessage(response.data));
  } catch {
    showNetworkError(submitError);
  }

  setSubmitting(submitButton, false);
}

function continueToSummary() {
  if (!state.date) {
    showAlert(scheduleError, 'Please choose a date for your booking.');
    return;
  }

  goToStep(3);
}

serviceOptions.addEventListener('change', ({ target }) => {
  const id = Number(target.value);

  if (target.checked) state.selectedIds.add(id);
  else state.selectedIds.delete(id);

  serviceContinue.disabled = state.selectedIds.size === 0;
});

timeFrom.addEventListener('change', () => renderEndTimes(timeTo.value));
serviceContinue.addEventListener('click', () => goToStep(2));
scheduleContinue.addEventListener('click', continueToSummary);
submitButton.addEventListener('click', submitBooking);

document.addEventListener('click', ({ target }) => {
  const trigger = target.closest('[data-go-to]');
  if (trigger) goToStep(Number(trigger.dataset.goTo));
});

const calendar = createCalendar(
  {
    monthLabel: document.getElementById('calendarMonth'),
    prevButton: document.getElementById('calendarPrev'),
    nextButton: document.getElementById('calendarNext'),
    dayGrid: document.getElementById('calendarDays'),
    status: document.getElementById('calendarStatus'),
  },
  loadBookedOnDate
);

async function init() {
  const customer = await startAccountPage();
  if (!customer) return;

  const requestedDate = new URLSearchParams(window.location.search).get('date');

  buildTimeOptions(timeFrom, OPEN_MINUTES, CLOSE_MINUTES - STEP_MINUTES, DEFAULT_FROM);
  renderEndTimes(DEFAULT_TO);
  goToStep(1);

  await Promise.all([loadServices(), requestedDate ? calendar.show(requestedDate) : calendar.load()]);
}

init();
