const express = require('express');
const calendarController = require('../controllers/calendarController');

const router = express.Router();

router.get('/month', calendarController.getMonthOverview);
router.get('/day', calendarController.getDayDetails);

module.exports = router;