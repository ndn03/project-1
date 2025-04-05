const db = require("../config/db");

class CartModel {
    // Tạo hoặc lấy giỏ hàng của user
    static async getOrCreateCart(userId) {
        const [cart] = await db.execute("SELECT id FROM cart WHERE user_id = ?", [userId]);
        if (cart.length === 0) {
            const [result] = await db.execute("INSERT INTO cart (user_id) VALUES (?)", [userId]);
            return result.insertId;
        }
        return cart[0].id;
    }

    // Kiểm tra sản phẩm
    static async getProduct(productId) {
        const [product] = await db.execute(
            "SELECT product_id, name, price, stock_quantity FROM products WHERE product_id = ?",
            [productId]
        );
        return product.length > 0 ? product[0] : null;
    }

    // Thêm hoặc cập nhật sản phẩm trong giỏ hàng
    static async addOrUpdateItem(cartId, productId, quantity) {
        const [existing] = await db.execute(
            "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
            [cartId, productId]
        );

        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            await db.execute(
                "UPDATE cart_items SET quantity = ? WHERE id = ?",
                [newQuantity, existing[0].id]
            );
            return existing[0].id;
        } else {
            const [product] = await db.execute(
                "SELECT price FROM products WHERE id = ?",
                [productId]
            );
            if (!product.length) throw new Error("Sản phẩm không tồn tại");
            const [result] = await db.execute(
                "INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [cartId, productId, quantity, product[0].price]
            );
            return result.insertId;
        }
    }

    // Lấy danh sách sản phẩm trong giỏ hàng
    static async getCartItems(cartId) {
        const [items] = await db.execute(
            `SELECT ci.id AS cart_item_id, ci.product_id, ci.quantity, ci.price, 
                    p.name AS product_name, p.image_url 
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = ?`,
            [cartId]
        );
        return items;
    }

    // Cập nhật số lượng sản phẩm
    static async updateItemQuantity(cartId, cartItemId, quantity) {
        const [result] = await db.execute(
            "UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?",
            [quantity, cartItemId, cartId]
        );
        return result.affectedRows;
    }

    // Xóa sản phẩm khỏi giỏ hàng
    static async deleteItem(cartId, cartItemId) {
        const [result] = await db.execute(
            "DELETE FROM cart_items WHERE id = ? AND cart_id = ?",
            [cartItemId, cartId]
        );
        return result.affectedRows;
    }

    // Lấy tổng tiền giỏ hàng
    // models/cart.model.js
    static async getCartTotal(cartId) {
    const [result] = await db.execute(
        "SELECT COALESCE(SUM(ci.price * ci.quantity), 0) AS total FROM cart_items ci WHERE ci.cart_id = ?",
        [cartId]
    );
    // COALESCE đảm bảo SUM trả về 0 nếu null
    return Number(result[0]?.total || 0); // Chuyển thành Number, xử lý trường hợp result[0] undefined
}

    // Kiểm tra voucher
    static async getVoucher(code) {
        const [voucher] = await db.execute(
            "SELECT * FROM vouchers WHERE code = ? AND valid_from <= CURDATE() AND valid_to >= CURDATE()",
            [code]
        );
        return voucher.length > 0 ? voucher[0] : null;
    }
}

module.exports = CartModel;