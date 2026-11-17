const AppError = require('./appError');
const { withTransaction } = require('../config/db');
const { BOOKING_STATUS } = require('../config/bookingStatus');
const { BOOKING_HOURS, SCHEDULE_CONFLICT_STATUSES } = require('../config/bookingRules');
const blockedDateModel = require('../models/blockedDateModel');
const bookingManagementModel = require('../models/bookingManagementModel');
const customerBookingModel = require('../models/customerBookingModel');
const { toCents, fromCents } = require('./money');
const { isValidIsoDate, timeTextToMinutes, todayIso } = require('./timeHelper');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const asText = (value) => String(value ?? '').trim();

function readServiceIds(value) {
  const ids = Array.isArray(value) ? value.map(Number) : [];
  const valid = ids.filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(valid)];
}

function readInput(body = {}) {
  return {
    serviceIds: readServiceIds(body.serviceIds),
    eventDate: asText(body.eventDate),
    startTime: asText(body.startTime),
    endTime: asText(body.endTime),
  };
}

function validateInput(input) {
  const errors = {};
  const opens = timeTextToMinutes(BOOKING_HOURS.open);
  const closes = timeTextToMinutes(BOOKING_HOURS.close);

  if (input.serviceIds.length === 0) errors.serviceIds = 'Choose at least one service.';

  if (!isValidIsoDate(input.eventDate)) errors.eventDate = 'Choose a date for your booking.';
  else if (input.eventDate < todayIso()) errors.eventDate = 'Choose today or a later date.';

  if (!TIME_PATTERN.test(input.startTime)) errors.startTime = 'Choose a start time.';
  if (!TIME_PATTERN.test(input.endTime)) errors.endTime = 'Choose an end time.';

  if (!errors.startTime && !errors.endTime) {
    const start = timeTextToMinutes(input.startTime);
    const end = timeTextToMinutes(input.endTime);

    if (end <= start) errors.endTime = 'End time must be later than the start time.';
    else if (start < opens || end > closes) {
      errors.startTime = `Bookings are accepted from ${BOOKING_HOURS.open} to ${BOOKING_HOURS.close} only.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Please fix the highlighted fields.', 400, errors);
  }
}

async function assertScheduleAvailable(connection, input) {
  if (await blockedDateModel.exists(input.eventDate)) {
    const message = 'This date is not available, choose other schedule.';
    throw new AppError(message, 409, { eventDate: message });
  }

  const conflict = await bookingManagementModel.findConflict(connection, {
    bookingId: 0,
    date: input.eventDate,
    startTime: input.startTime,
    endTime: input.endTime,
    serviceIds: input.serviceIds,
    statuses: SCHEDULE_CONFLICT_STATUSES,
  });

  if (conflict) {
    const message = 'This date or time is not available, choose other schedule.';
    throw new AppError(message, 409, { schedule: message });
  }
}

async function createBooking(customerId, body) {
  const input = readInput(body);
  validateInput(input);

  return withTransaction(async (connection) => {
    const services = await customerBookingModel.findAvailableServices(connection, input.serviceIds);

    if (services.length !== input.serviceIds.length) {
      const message = 'One of the selected services is no longer available.';
      throw new AppError(message, 409, { serviceIds: message });
    }

    await assertScheduleAvailable(connection, input);

    const subtotalCents = services.reduce((sum, service) => sum + toCents(service.price), 0);
    const subtotal = fromCents(subtotalCents);

    const id = await customerBookingModel.create(connection, {
      customerId,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime,
      subtotal,
      totalAmount: subtotal,
    });

    await customerBookingModel.addServices(connection, id, services);

    return {
      id,
      reference: await customerBookingModel.findReference(connection, id),
      status: BOOKING_STATUS.PENDING,
      totalAmount: subtotal,
    };
  });
}

module.exports = { createBooking };
