const dashboardService = require('../services/dashboardService');

async function getSummary(req, res, next) {
  try {
    res.json(await dashboardService.getSummary());
  } catch (error) {
    next(error);
  }
}

async function getUpcomingBookings(req, res, next) {
  try {
    res.json(await dashboardService.getUpcomingBookings());
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary, getUpcomingBookings };