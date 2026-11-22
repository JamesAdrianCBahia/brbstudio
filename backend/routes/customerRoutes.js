const express = require('express');
const customerController = require('../controllers/customerController');
const requireCustomer = require('../middleware/requireCustomer');

const router = express.Router();

router.use(requireCustomer);

router.get('/profile',           customerController.getProfile);
router.put('/profile',           customerController.updateProfile);
router.post('/profile/password', customerController.changePassword);

module.exports = router;
