const AppError = require('./appError');
const bookingModel = require('../models/bookingModel');
const blockedDateModel = require('../models/blockedDateModel');
const { CALENDAR_STATUSES, UPCOMING_STATUSES } = require('../config/bookingStatus');
const { formatMinutes, isValidIsoDate, todayIso } = require('./timeHelper');

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function requireDate(value) {
  if (!isValidIsoDate(value)) {
    const message = 'Date must be a valid YYYY-MM-DD value.';
    throw new AppError(message, 400, { date: message });
  }

  return value;
}

function monthRange(month) {
  if (!MONTH_PATTERN.test(month ?? '')) {
    throw new AppError('Month must be in YYYY-MM format.', 400, { month: 'Month must be in YYYY-MM format.' });
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0');

  return { start: `${month}-01`, end: `${month}-${lastDay}` };
}

function toBookingSummary(row) {
  return {
    id: row.id,
    clientName: row.clientName,
    services: row.serviceNames,
    status: row.status,
    timeLabel: `${formatMinutes(row.startMinutes)} - ${formatMinutes(row.endMinutes)}`,
  };
}

async function getMonthOverview(month) {
  const { start, end } = monthRange(month);

  const [bookedDates, blockedDates] = await Promise.all([
    bookingModel.findBookedDates(start, end, CALENDAR_STATUSES),
    blockedDateModel.findBetween(start, end),
  ]);

  return { month, bookedDates, blockedDates };
}

async function getDayDetails(date) {
  requireDate(date);

  const [bookings, blocked] = await Promise.all([
    bookingModel.findOnDate(date, CALENDAR_STATUSES),
    blockedDateModel.exists(date),
  ]);

  return { date, blocked, bookings: bookings.map(toBookingSummary) };
}

module.exports = {
  getMonthOverview,
  getDayDetails
};