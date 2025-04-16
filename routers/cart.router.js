const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Áp dụng middleware xác thực
router.use(authMiddleware.authenticateToken);

// Các route cho giỏ hàng
router.get('/', cartController.getCart); // Hiển thị giỏ hàng
router.post('/add', cartController.addToCart); // Thêm sản phẩm vào giỏ hàng
router.post('/apply-voucher', cartController.applyVoucher); // Áp dụng voucher
router.put('/update', cartController.updateCartItem); // Cập nhật số lượng sản phẩm
router.delete('/remove/:cartItemId', cartController.removeCartItem); // Xóa sản phẩm khỏi giỏ hàng
router.get('/data', cartController.getCartData);
module.exports = router;    