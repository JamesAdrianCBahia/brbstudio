const calendarService = require('../services/calendarService');
const sendError = require('./errorResponse');

async function getMonthOverview(req, res, next) {
  try {
    res.json(await calendarService.getMonthOverview(req.query.month));
  } catch (error) {
    sendError(error, res, next);
  }
}

module.exports = {
  getMonthOverview
};
