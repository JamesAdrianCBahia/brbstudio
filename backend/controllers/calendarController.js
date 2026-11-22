const calendarService = require('../services/calendarService');
const sendError = require('./errorResponse');

async function getMonthOverview(req, res, next) {
  try {
    res.json(await calendarService.getMonthOverview(req.query.month));
  } catch (error) {
    sendError(error, res, next);
  }
}

async function getDayDetails(req, res, next) {
  try {
    res.json(await calendarService.getDayDetails(req.query.date));
  } catch (error) {
    sendError(error, res, next);
  }
}

module.exports = {
  getMonthOverview,
  getDayDetails
};
