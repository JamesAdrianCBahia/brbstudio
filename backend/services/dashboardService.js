const bookingModel = require('../models/bookingModel');
const customerModel = require('../models/customerModel');

const {
  BOOKING_STATUS,
  COLLECTIBLE_STATUSES,
} = require('../config/bookingStatus');

async function getSummary() {
  const [totalBookings, waitingForReview, totalClients, paymentsToCollect] = await Promise.all([
    bookingModel.countAll(),
    bookingModel.countByStatus(BOOKING_STATUS.PENDING),
    customerModel.countAll(),
    bookingModel.sumBalanceByStatuses(COLLECTIBLE_STATUSES),
  ]);

  return { totalBookings, waitingForReview, totalClients, paymentsToCollect };
}

module.exports = { getSummary };