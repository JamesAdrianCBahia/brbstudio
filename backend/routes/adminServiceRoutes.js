const express = require('express');
const serviceController = require('../controllers/serviceController');
const { uploadSingleImage } = require('../config/upload');

const router = express.Router();

router.get('/', serviceController.listAll);
router.post('/', uploadSingleImage('image'), serviceController.create);

module.exports = router;