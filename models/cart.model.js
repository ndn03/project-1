const pool = require('../config/db'); // pool là Promise-based pool

const cartModel = {
    async getOrCreateCart(userId) {
        const [rows] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [userId]);
        if (rows.length === 0) {
            const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
            return result.insertId;
        }
        return rows[0].cart_id;
    },

    async getProduct(productId) {
        const [rows] = await pool.query(
            'SELECT product_id, name, price, stock_quantity, image_url FROM products WHERE product_id = ?',
            [productId]
        );
        return rows[0] || null;
    },

    async addOrUpdateItem(cartId, productId, quantity, price) {
        const [existing] = await pool.query(
            'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [cartId, productId]
        );
        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
                [newQuantity, existing[0].cart_item_id]
            );
            return existing[0].cart_item_id;
        } else {
            const [result] = await pool.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [cartId, productId, quantity, price]
            );
            return result.insertId;
        }
    },

    async getCartItems(cartId) {
        const [items] = await pool.query(
            `SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.price, 
                    p.name AS product_name, p.image_url 
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.product_id
             WHERE ci.cart_id = ?`,
            [cartId]
        );
        return items;
    },

    async getCartTotal(cartId) {
        const [result] = await pool.query(
            'SELECT COALESCE(SUM(ci.price * ci.quantity), 0) AS total FROM cart_items ci WHERE ci.cart_id = ?',
            [cartId]
        );
        return Number(result[0].total);
    },

    async getVoucher(code) {
        const [voucher] = await pool.query(
            'SELECT * FROM vouchers WHERE code = ? AND start_date <= CURDATE() AND end_date >= CURDATE()',
            [code]
        );
        return voucher[0] || null;
    },

    async applyVoucher(cartId, voucherCode) {
        await pool.query('UPDATE cart SET voucher_code = ? WHERE cart_id = ?', [voucherCode, cartId]);
    },

    async getAppliedVoucher(cartId) {
        const [cart] = await pool.query('SELECT voucher_code FROM cart WHERE cart_id = ?', [cartId]);
        if (cart[0]?.voucher_code) {
            return await this.getVoucher(cart[0].voucher_code);
        }
        return null;
    },

    async updateItemQuantity(cartId, cartItemId, quantity) {
        const [item] = await pool.query(
            'SELECT product_id FROM cart_items WHERE cart_item_id = ? AND cart_id = ?',
            [cartItemId, cartId]
        );
        if (item.length === 0) return null;

        const product = await this.getProduct(item[0].product_id);
        if (!product || product.stock_quantity < quantity) {
            throw new Error('Số lượng vượt quá tồn kho hoặc sản phẩm không tồn tại');
        }

        const [result] = await pool.query(
            'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND cart_id = ?',
            [quantity, cartItemId, cartId]
        );
        return result.affectedRows;
    },

    async deleteItem(cartId, cartItemId) {
        const [result] = await pool.query(
            'DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?',
            [cartItemId, cartId]
        );
        return result.affectedRows;
    },

    async checkUserExists(userId) {
        const [user] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        return user.length > 0;
    }
};

module.exports = cartModel;