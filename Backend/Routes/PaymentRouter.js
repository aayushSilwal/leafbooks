const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth');
const { initiatePayment, verifyPayment, getOrders } = require('../Controllers/PaymentController');

router.post('/initiate', auth, initiatePayment);
router.get('/verify', verifyPayment);   
router.post('/verify', verifyPayment);  
router.get('/orders',    auth, getOrders);

module.exports = router;