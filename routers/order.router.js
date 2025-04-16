const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/checkout', authMiddleware.authenticateToken, orderController.showCheckout);
router.post('/orders', authMiddleware.authenticateToken, orderController.createOrder);
router.get('/orders/:orderId', authMiddleware.authenticateToken, orderController.getOrder);

module.exports = router;