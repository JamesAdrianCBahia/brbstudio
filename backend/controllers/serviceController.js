const serviceService = require('../services/serviceManagementService');
const sendError = require('./errorResponse');

async function listAll(req, res, next) {
  try {
    res.json(await serviceService.listServices());
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await serviceService.createService(req.body, req.file));
  } catch (error) {
    sendError(error, res, next);
  }
}

module.exports = { listAll, create };