// routes/cart.routes.js
const express = require("express");
const router = express.Router();
const CartController = require("../controllers/cart.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/add", authMiddleware.authenticateToken, CartController.addToCart); // Thêm sản phẩm
router.get("/", authMiddleware.authenticateToken, CartController.getCart); // Lấy giỏ hàng (API JSON)
router.put("/:cartItemId", authMiddleware.authenticateToken, CartController.updateCartItem); // Cập nhật số lượng
router.delete("/:cartItemId", authMiddleware.authenticateToken, CartController.deleteCartItem); // Xóa sản phẩm
router.post("/apply-voucher", authMiddleware.authenticateToken, CartController.applyVoucher); // Áp dụng voucher

// Render trang giỏ hàng
// routes/cart.routes.js
router.get("/cart", authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await CartService.getCart(userId);
        res.render("cart", { cart }); // Render cart.ejs
    } catch (error) {
        console.error("Lỗi khi render giỏ hàng:", error);
        res.status(500).json({ message: "Alert: Lỗi máy chủ" });
    }
});
module.exports = router;