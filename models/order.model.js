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
    },

    async updateOrderStatus(orderId, statusId) {
        try {
            // Kiểm tra xem đơn hàng có tồn tại không
            const [order] = await pool.query(
                'SELECT * FROM orders WHERE order_id = ?',
                [orderId]
            );

            if (order.length === 0) {
                throw new Error('Không tìm thấy đơn hàng');
            }

            // Kiểm tra xem trạng thái có tồn tại không
            const [status] = await pool.query(
                'SELECT * FROM order_status WHERE order_status_id = ?',
                [statusId]
            );

            if (status.length === 0) {
                throw new Error('Trạng thái không hợp lệ');
            }

            // Cập nhật trạng thái đơn hàng
            await pool.query(
                'UPDATE orders SET status_id = ? WHERE order_id = ?',
                [statusId, orderId]
            );

            // Nếu trạng thái là "HOÀN THÀNH", cập nhật doanh thu
            if (status[0].status === 'Hoàn thành') {
                // Lấy thông tin đơn hàng
                const [orderInfo] = await pool.query(
                    'SELECT user_id, final_amount FROM orders WHERE order_id = ?',
                    [orderId]
                );

                if (orderInfo.length > 0) {
                    // Cập nhật tổng doanh thu trong user_profiles
                    await pool.query(
                        'UPDATE user_profiles SET total_purchased = total_purchased + ? WHERE user_id = ?',
                        [orderInfo[0].final_amount, orderInfo[0].user_id]
                    );
                }
            }

            // Lấy thông tin đơn hàng sau khi cập nhật
            const [updatedOrder] = await pool.query(
                `SELECT o.*, os.status as status_name, pm.name as payment_method_name
                FROM orders o
                LEFT JOIN order_status os ON o.status_id = os.order_status_id
                LEFT JOIN payment_methods pm ON o.payment_method_id = pm.payment_method_id
                WHERE o.order_id = ?`,
                [orderId]
            );

            return updatedOrder[0];
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
            throw error;
        }
    },

    async getActualRevenue() {
        const [result] = await pool.query(
            `SELECT COALESCE(SUM(final_amount), 0) AS actual_revenue
             FROM orders
             WHERE status_id = (SELECT order_status_id FROM order_status WHERE status = 'Hoàn thành')`
        );
        return result[0].actual_revenue;
    },

    async getExpectedRevenue() {
        const [result] = await pool.query(
            `SELECT COALESCE(SUM(final_amount), 0) AS expected_revenue
             FROM orders`
        );
        return result[0].expected_revenue;
    },
}

module.exports = orderModel;