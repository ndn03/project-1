// controllers/cart.controller.js
const CartService = require("../services/cart.service");

class CartController {
    // Thêm sản phẩm vào giỏ hàng
    static async addToCart(req, res) {
        try {
            const { product_id, quantity = 1 } = req.body;
            const userId = req.user.id; // Từ authMiddleware, khớp với bảng users

            if (!product_id || !Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ message: "Alert: Dữ liệu không hợp lệ" });
            }

            const result = await CartService.addToCart(userId, product_id, quantity);
            res.status(200).json({ 
                message: "Alert: Đã thêm sản phẩm vào giỏ hàng", 
                data: result 
            });
        } catch (error) {
            console.error("Lỗi trong addToCart:", error);
            // Sửa: Phân biệt lỗi client (400) và server (500)
            const status = error.message.includes("Alert:") ? 400 : 500;
            res.status(status).json({ message: error.message });
        }
    }

    // Xem giỏ hàng
    static async getCart(req, res) {
        try {
            const userId = req.user.id;
            const cart = await CartService.getCart(userId);
            res.status(200).json({ 
                message: "Alert: Lấy giỏ hàng thành công", 
                data: cart 
            });
        } catch (error) {
            console.error("Lỗi trong getCart:", error);
            res.status(500).json({ message: error.message });
        }
    }

    // Cập nhật số lượng sản phẩm
    static async updateCartItem(req, res) {
        try {
            const { cartItemId } = req.params;
            const { quantity } = req.body;
            const userId = req.user.id;

            // Sửa: Kiểm tra cartItemId và quantity
            if (!cartItemId || isNaN(cartItemId)) {
                return res.status(400).json({ message: "Alert: ID mục giỏ hàng không hợp lệ" });
            }
            if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ message: "Alert: Số lượng không hợp lệ" });
            }

            await CartService.updateCartItem(userId, cartItemId, quantity);
            res.status(200).json({ 
                message: "Alert: Đã cập nhật số lượng" 
            });
        } catch (error) {
            console.error("Lỗi trong updateCartItem:", error);
            const status = error.message.includes("Alert:") ? 400 : 500;
            res.status(status).json({ message: error.message });
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    static async deleteCartItem(req, res) {
        try {
            const { cartItemId } = req.params;
            const userId = req.user.id;

            // Sửa: Kiểm tra cartItemId
            if (!cartItemId || isNaN(cartItemId)) {
                return res.status(400).json({ message: "Alert: ID mục giỏ hàng không hợp lệ" });
            }

            await CartService.deleteCartItem(userId, cartItemId);
            res.status(200).json({ 
                message: "Alert: Đã xóa sản phẩm khỏi giỏ hàng" 
            });
        } catch (error) {
            console.error("Lỗi trong deleteCartItem:", error);
            const status = error.message.includes("Alert:") ? 400 : 500;
            res.status(status).json({ message: error.message });
        }
    }

    // Áp dụng mã giảm giá
    static async applyVoucher(req, res) {
        try {
            const { code } = req.body;
            const userId = req.user.id;

            if (!code || typeof code !== "string" || code.trim() === "") {
                return res.status(400).json({ message: "Alert: Mã giảm giá không được để trống" });
            }

            const result = await CartService.applyVoucher(userId, code);
            res.status(200).json({ 
                message: "Alert: Áp dụng mã giảm giá thành công", 
                data: result 
            });
        } catch (error) {
            console.error("Lỗi trong applyVoucher:", error);
            const status = error.message.includes("Alert:") ? 400 : 500;
            res.status(status).json({ message: error.message });
        }
    }
}

module.exports = CartController;