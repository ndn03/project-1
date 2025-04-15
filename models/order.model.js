const pool = require('../config/db');

const orderModel = {
    async createOrder(orderData) {
        const {
            user_id, total_amount, shipping_fee, discount_amount, final_amount,
            status_id, payment_method_id, payment_status,
            province_id, district_id, ward_id, full_address
        } = orderData;

        const [result] = await pool.query(
            `INSERT INTO orders (
                user_id, total_amount, shipping_fee, discount_amount, final_amount,
                status_id, payment_method_id, payment_status,
                province_id, district_id, ward_id, full_address,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                user_id, total_amount, shipping_fee, discount_amount, final_amount,
                status_id, payment_method_id, payment_status,
                province_id, district_id, ward_id, full_address
            ]
        );
        return result.insertId;
    },

    async createOrderItems(orderId, items) {
        const values = items.map(item => [orderId, item.product_id, item.quantity, item.price]);
        await pool.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
            [values]
        );
    },

    async getOrderById(orderId, userId) {
        const [orders] = await pool.query(
            `SELECT o.*, os.status AS status_name, pm.name AS method_name
             FROM orders o
             JOIN order_status os ON o.status_id = os.order_status_id
             JOIN payment_methods pm ON o.payment_method_id = pm.payment_method_id
             WHERE o.order_id = ? AND o.user_id = ?`,
            [orderId, userId]
        );

        if (orders.length === 0) return null;

        const [items] = await pool.query(
            `SELECT oi.*, p.name AS product_name, p.image_url
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        return { ...orders[0], items };
    },

    async updateProductStock(items) {
        for (const item of items) {
            await pool.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }
    },

    async checkProductStock(items) {
        for (const item of items) {
            const [product] = await pool.query(
                'SELECT stock_quantity FROM products WHERE product_id = ?',
                [item.product_id]
            );
            if (!product[0] || product[0].stock_quantity < item.quantity) {
                throw new Error(`Sản phẩm ${item.product_id} không còn đủ hàng`);
            }
        }
    },

    async clearCart(cartId) {
        await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        await pool.query('DELETE FROM cart WHERE cart_id = ?', [cartId]);
    },

    async canUserReviewProduct(userId, productId) {
        const [orders] = await pool.query(
            `SELECT o.order_id
             FROM orders o
             JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.user_id = ? AND oi.product_id = ? AND o.status_id = 3`,
            [userId, productId]
        );
        return orders.length > 0;
    }
};

module.exports = orderModel;