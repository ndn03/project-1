const CartModel = require("../models/cart.model");
const db = require("../config/db"); // Thêm db để dùng trong updateCartItem

class CartService {
    // Thêm sản phẩm vào giỏ hàng
    static async addToCart(userId, productId, quantity) {
        const product = await CartModel.getProduct(productId);
        if (!product) throw new Error("Sản phẩm không tồn tại");
        if (product.stock_quantity < quantity) throw new Error("Số lượng tồn kho không đủ");

        const cartId = await CartModel.getOrCreateCart(userId);
        const cartItemId = await CartModel.addOrUpdateItem(cartId, productId, quantity);

        return { cartId, cartItemId };
    }

    // Xem giỏ hàng
    static async getCart(userId) {
        const cartId = await CartModel.getOrCreateCart(userId);
        const items = await CartModel.getCartItems(cartId);
        const total = await CartModel.getCartTotal(cartId);

        // Đảm bảo total là số
        const safeTotal = (total !== null && !isNaN(total)) ? Number(total) : 0;

        return {
            cartId,
            items,
            total: safeTotal.toFixed(2)
        };
    }
     

    // Cập nhật số lượng sản phẩm
    static async updateCartItem(userId, cartItemId, quantity) {
        const cartId = await CartModel.getOrCreateCart(userId);
        
        // Sửa: Dùng db và kiểm tra item.length
        const [item] = await db.execute(
            "SELECT product_id FROM cart_items WHERE id = ? AND cart_id = ?",
            [cartItemId, cartId]
        );
        if (item.length === 0) throw new Error("Sản phẩm không có trong giỏ hàng");

        const product = await CartModel.getProduct(item[0].product_id); // Sửa: Truy cập item[0]
        if (!product) throw new Error("Sản phẩm không tồn tại");
        if (quantity > product.stock_quantity) throw new Error("Số lượng vượt quá tồn kho");

        const affectedRows = await CartModel.updateItemQuantity(cartId, cartItemId, quantity);
        if (affectedRows === 0) throw new Error("Không thể cập nhật sản phẩm");

        return true;
    }

    // Xóa sản phẩm khỏi giỏ hàng
    static async deleteCartItem(userId, cartItemId) {
        const cartId = await CartModel.getOrCreateCart(userId);
        const affectedRows = await CartModel.deleteItem(cartId, cartItemId);
        if (affectedRows === 0) throw new Error("Sản phẩm không có trong giỏ hàng");

        return true;
    }

    // Áp dụng mã giảm giá
    static async applyVoucher(userId, code) {
        const cartId = await CartModel.getOrCreateCart(userId);
        const total = await CartModel.getCartTotal(cartId);
        const voucher = await CartModel.getVoucher(code);

        if (!voucher) throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
        
        // Kiểm tra min_order_value, dùng giá trị mặc định 0 nếu không có
        const minOrderValue = voucher.min_order_value || 0;
        if (total < minOrderValue) {
            throw new Error(`Đơn hàng phải có giá trị tối thiểu ${minOrderValue} để áp dụng mã này`);
        }

        // Sửa: Dùng discount_type và discount từ bảng vouchers
        const discountAmount = voucher.discount_type === "percentage"
            ? (total * voucher.discount) / 100
            : voucher.discount;

        const finalTotal = total - discountAmount;

        return {
            original_total: total.toFixed(2),
            discount: discountAmount.toFixed(2),
            final_total: finalTotal.toFixed(2)
        };
    }
}

module.exports = CartService;