const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/checkout', authMiddleware.authenticateToken, orderController.showCheckout);
router.post('/orders', authMiddleware.authenticateToken, orderController.createOrder);
router.get('/orders/:orderId', authMiddleware.authenticateToken, orderController.getOrder);

// Route để lấy thông tin doanh thu
router.get('/api/revenue', orderController.getRevenue);

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

module.exports = router;