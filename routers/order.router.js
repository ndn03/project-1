const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Hiển thị form đặt hàng (GET /checkout)
// Yêu cầu người dùng phải đăng nhập (authenticateToken)
router.get('/checkout', authMiddleware.authenticateToken, orderController.showCheckout);

// Tạo đơn hàng mới (POST /orders)
// Yêu cầu người dùng phải đăng nhập (authenticateToken)
router.post('/orders', authMiddleware.authenticateToken, orderController.createOrder);

// Xem chi tiết đơn hàng (GET /orders/:orderId)
// Yêu cầu người dùng phải đăng nhập (authenticateToken)
router.get('/orders/:orderId', authMiddleware.authenticateToken, orderController.getOrder);

module.exports = router;