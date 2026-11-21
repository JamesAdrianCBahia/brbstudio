const serviceService = require('../services/serviceManagementService');

async function listAll(req, res, next) {
  try {
    res.json(await serviceService.listServices());
  } catch (error) {
    next(error);
  }
}

module.exports = { listAll };