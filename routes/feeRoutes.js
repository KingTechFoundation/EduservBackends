const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

router.get('/fees', feeController.getAllFees);
router.post('/fees', feeController.addFee);

module.exports = router;
