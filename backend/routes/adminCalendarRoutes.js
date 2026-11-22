const express = require('express');
const calendarController = require('../controllers/calendarController');

const router = express.Router();

router.get('/month', calendarController.getMonthOverview);
router.get('/day', calendarController.getDayDetails);
router.post('/blocked-dates', calendarController.blockDate);
router.delete('/blocked-dates/:date', calendarController.unblockDate);

module.exports = router;
