const authService = require('../services/authService');
const sendError = require('./errorResponse');

async function register(req, res, next) {
  try {
    await authService.registerCustomer(req.body);
    res.status(201).json({
      message: 'Account created successfully.',
      redirectTo: `${authService.LOGIN_PAGE}?registered=1`,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

module.exports = { register };
