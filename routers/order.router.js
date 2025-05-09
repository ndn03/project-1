const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes (dành cho người dùng đã đăng nhập)
router.get('/checkout', authMiddleware.authenticateToken, orderController.showCheckout);
router.post('/orders', authMiddleware.authenticateToken, orderController.createOrder);
router.get('/orders/:orderId', authMiddleware.authenticateToken, orderController.getOrder);
router.get('/orders/user', authMiddleware.authenticateToken, orderController.getOrdersByUserId);
router.post('/orders/review', authMiddleware.authenticateToken, orderController.createReview);

// Admin routes
router.get('/admin/api/orders', 
    authMiddleware.authenticateToken, 
    authMiddleware.authorizeRoles('admin'), 
    orderController.getAllOrders
);
router.get('/admin/api/order-statuses', 
    authMiddleware.authenticateToken, 
    authMiddleware.authorizeRoles('admin'), 
    orderController.getAllStatuses
);
router.get('/admin/api/orders/:id', 
    authMiddleware.authenticateToken, 
    authMiddleware.authorizeRoles('admin'), 
    orderController.getOrderById
);
router.put('/admin/api/orders/:id', 
    authMiddleware.authenticateToken, 
    authMiddleware.authorizeRoles('admin'), 
    orderController.updateOrderStatus
);
router.delete('/admin/api/orders/:id', 
    authMiddleware.authenticateToken, 
    authMiddleware.authorizeRoles('admin'), 
    orderController.deleteOrder
);

// Admin-only route for revenue
router.get('/admin/api/revenue', 
    authMiddleware.authenticateToken, 
    authMiddleware.authorizeRoles('admin'), 
    orderController.getRevenue
);

module.exports = router;