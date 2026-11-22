const express = require('express');
const calendarController = require('../controllers/calendarController');

const router = express.Router();

router.get('/month', calendarController.getMonthOverview);

module.exports = router;