const customerService = require('../services/customerService');
const sendError = require('./errorResponse');

async function getProfile(req, res, next) {
  try {
    const profile = await customerService.getProfile(req.session.customer.id);
    res.json({ profile });
  } catch (error) {
    sendError(error, res, next);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await customerService.updateProfile(req.session.customer.id, req.body);
    req.session.customer = { ...req.session.customer, ...profile };
    res.json({ profile });
  } catch (error) {
    sendError(error, res, next);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await customerService.changePassword(req.session.customer.id, req.body);
    res.json(result);
  } catch (error) {
    sendError(error, res, next);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
