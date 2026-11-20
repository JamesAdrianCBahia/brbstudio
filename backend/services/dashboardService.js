const bookingModel = require('../models/bookingModel');
const customerModel = require('../models/customerModel');

const {
  BOOKING_STATUS,
  UPCOMING_STATUSES,
  COLLECTIBLE_STATUSES,
} = require('../config/bookingStatus');

const UPCOMING_LIMIT = 10;

async function getSummary() {
  const [totalBookings, waitingForReview, totalClients, paymentsToCollect] = await Promise.all([
    bookingModel.countAll(),
    bookingModel.countByStatus(BOOKING_STATUS.PENDING),
    customerModel.countAll(),
    bookingModel.sumBalanceByStatuses(COLLECTIBLE_STATUSES),
  ]);

  return { totalBookings, waitingForReview, totalClients, paymentsToCollect };
}

async function getUpcomingBookings() {
  const rows = await bookingModel.findUpcoming(UPCOMING_STATUSES, UPCOMING_LIMIT);

  return rows.map(({ id, eventDate, serviceName, clientName, startMinutes }) => ({
    id,
    eventDate,
    serviceName,
    clientName,
    startTime: formatMinutes(startMinutes),
  }));
}

module.exports = { getSummary, getUpcomingBookings };