const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');
const brandController = require('../controllers/brand.controller');
const categoryController = require('../controllers/category.controller');
const overviewController = require('../controllers/overview.controller');
const orderController = require('../controllers/order.controller');
const paymentMethodController = require('../controllers/paymentMethod.controller');
const userController = require('../controllers/user.controller');
const voucherController = require('../controllers/voucher.controller');
const commentController = require('../controllers/comment.controller');

// Middleware kiểm tra vai trò admin
const restrictToAdminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        console.log('Access denied - User:', req.user);
        return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập' });
    }
    next();
};

// Áp dụng middleware xác thực cho tất cả các route
router.use(authMiddleware.authenticateToken);
router.use(restrictToAdminMiddleware);

// Admin dashboard view
router.get('/', (req, res) => {
    res.render('admin');
});

// Overview API route
router.get('/api/overview', overviewController.getOverview);

// Product API routes
router.get('/api/products', productController.getAllProducts);
router.get('/api/products/:id', productController.getProductById);
router.post('/api/products', productController.createProduct);
router.put('/api/products/:id', productController.updateProduct);
router.delete('/api/products/:id', productController.deleteProduct);

// Brand API routes
router.get('/api/brands', brandController.getAllBrands);
router.post('/api/brands', brandController.createBrand);
router.put('/api/brands/:id', brandController.updateBrand);
router.delete('/api/brands/:id', brandController.deleteBrand);

// Category API routes
router.get('/api/categories', categoryController.getAllCategories);
router.post('/api/categories', categoryController.createCategory);
router.put('/api/categories/:id', categoryController.updateCategory);
router.delete('/api/categories/:id', categoryController.deleteCategory);

// Order API routes
router.get('/api/orders', orderController.getAllOrders);
router.get('/api/orders/:id', orderController.getOrderById);
router.put('/api/orders/:id', orderController.updateOrderStatus);
router.delete('/api/orders/:id', orderController.deleteOrder);

router.get('/api/order-statuses', orderController.getAllStatuses);

// Payment Method API routes
router.get('/api/payment-methods', paymentMethodController.getAll);
router.post('/api/payment-methods', paymentMethodController.create);
router.put('/api/payment-methods/:id', paymentMethodController.update);
router.delete('/api/payment-methods/:id', paymentMethodController.remove);

// User API route
router.get('/api/users', userController.getAllUsers);
router.put('/api/users/:id/role', userController.updateUserRole);
router.put('/api/users/:id/status', userController.updateUserStatus);
router.post('/api/users', userController.createUser);
router.delete('/api/users/:id', userController.deleteUser);

router.get('/api/vouchers', voucherController.getAllVouchers);
router.post('/api/vouchers', voucherController.createVoucher);
router.put('/api/vouchers/:id', voucherController.updateVoucher);
router.delete('/api/vouchers/:id', voucherController.deleteVoucher);

// Route lấy danh sách đánh giá
router.get('/api/comments', commentController.getAllComments);

// Route xóa đánh giá
router.delete('/api/comments/:id', commentController.deleteComment);

// Route ẩn đánh giá
router.put('/api/comments/:id/hide', commentController.hideComment);

module.exports = router;