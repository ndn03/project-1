const axios = require('axios');
const cartModel = require('../models/cart.model');
const orderModel = require('../models/order.model');
const db = require('../config/db');

const orderService = {
    async getUserOrders(userId, page, limit) {
        try {
            const offset = (page - 1) * limit;

            const [orders] = await db.query(
                `SELECT o.order_id, o.final_amount, o.created_at, os.status,
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'product_id', oi.product_id,
                                'quantity', oi.quantity,
                                'price', oi.price,
                                'name', p.name,
                                'image_url', p.image_url
                            )
                        ) AS items
                 FROM orders o
                 JOIN order_status os ON o.status_id = os.order_status_id
                 JOIN order_items oi ON o.order_id = oi.order_id
                 JOIN products p ON oi.product_id = p.product_id
                 WHERE o.user_id = ?
                 GROUP BY o.order_id
                 ORDER BY o.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, parseInt(limit), parseInt(offset)]
            );

            // Format orders and check review eligibility
            const formattedOrders = await Promise.all(orders.map(async (order) => {
                const items = JSON.parse(`[${order.items}]`);
                const itemsWithReviewStatus = await Promise.all(items.map(async (item) => {
                    const canReview = await this.canUserReviewProduct(userId, item.product_id);
                    return {
                        product_id: item.product_id,
                        product_name: item.name,
                        quantity: item.quantity,
                        price: parseFloat(item.price) || 0,
                        image_url: item.image_url || '',
                        canReview
                    };
                }));

                return {
                    order_id: order.order_id,
                    final_amount: parseFloat(order.final_amount) || 0,
                    created_at: new Date(order.created_at).toLocaleString('vi-VN'),
                    status: order.status || 'Chờ xác nhận',
                    items: itemsWithReviewStatus
                };
            }));

            return formattedOrders;
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy danh sách đơn hàng của người dùng:', error.message);
            throw new Error('Không thể lấy danh sách đơn hàng: ' + error.message);
        }
    },

    async canUserReviewProduct(userId, productId) {
        try {
            const canReview = await orderModel.canUserReviewProduct(userId, productId);
            if (!canReview) {
                return false;
            }
            const hasReviewed = await orderModel.hasUserReviewedProduct(userId, productId);
            return !hasReviewed;
        } catch (error) {
            console.error(`[OrderService] Lỗi khi kiểm tra khả năng đánh giá sản phẩm: ${error.message}`);
            throw new Error('Không thể kiểm tra khả năng đánh giá: ' + error.message);
        }
    },

    async hasUserReviewedProduct(userId, productId) {
        try {
            const [rows] = await db.query(
                `SELECT COUNT(*) as count FROM reviews WHERE user_id = ? AND product_id = ? AND isActive = 1`,
                [userId, productId]
            );
            return rows[0].count > 0;
        } catch (error) {
            console.error(`[OrderService] Lỗi khi kiểm tra đánh giá: ${error.message}`);
            throw new Error('Không thể kiểm tra trạng thái đánh giá: ' + error.message);
        }
    },

    async createReview(userId, productId, rating, comment) {
        try {
            const canReview = await this.canUserReviewProduct(userId, productId);
            if (!canReview) {
                throw new Error('Bạn không thể đánh giá sản phẩm này');
            }

            const reviewId = await orderModel.createReview(userId, productId, rating, comment);
            return { reviewId, userId, productId, rating, comment };
        } catch (error) {
            console.error(`[OrderService] Lỗi khi tạo đánh giá: ${error.message}`);
            throw new Error('Không thể tạo đánh giá: ' + error.message);
        }
    },

    async addOrderReview(userId, orderId, rating, comment) {
        try {
            const [order] = await db.query(
                `SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status_id = (SELECT order_status_id FROM order_status WHERE status = 'Hoàn thành')`,
                [orderId, userId]
            );

            if (!order.length) {
                throw new Error("Order not found or not in completed status.");
            }

            const [orderItems] = await db.query(
                `SELECT product_id FROM order_items WHERE order_id = ? LIMIT 1`,
                [orderId]
            );
            if (!orderItems.length) {
                throw new Error("No product found in this order.");
            }
            const productId = orderItems[0].product_id;

            const hasReviewed = await this.hasUserReviewedProduct(userId, productId);
            if (hasReviewed) {
                throw new Error("You have already reviewed this product.");
            }

            const [result] = await db.query(
                `INSERT INTO reviews (user_id, product_id, rating, comment, isActive, created_at, updated_at, updated_by)
                 VALUES (?, ?, ?, ?, 1, NOW(), NOW(), NULL)`,
                [userId, productId, rating, comment]
            );

            return result;
        } catch (error) {
            console.error("[addOrderReview] Error while adding review:", error);
            throw new Error("Unable to add review: " + error.message);
        }
    },

    async createOrder(userId, cartId, paymentMethodId, shippingAddress, receiverName, receiverPhone, note) {
        try {
            let cartItems = await cartModel.getCartItems(cartId);
            if (cartItems.length === 0) {
                throw new Error('Giỏ hàng trống');
            }
            await orderModel.checkProductStock(cartItems);
            const { province_id, district_id, ward_id, street_address } = shippingAddress;
            const provinceRes = await axios.get(`https://provinces.open-api.vn/api/p/${province_id}`);
            if (!provinceRes.data || !provinceRes.data.name) {
                throw new Error(`Không tìm thấy tỉnh với province_id: ${province_id}`);
            }
            const province = provinceRes.data.name;
            const districtRes = await axios.get(`https://provinces.open-api.vn/api/d/${district_id}`);
            if (!districtRes.data || !districtRes.data.name) {
                throw new Error(`Không tìm thấy quận với district_id: ${district_id}`);
            }
            const district = districtRes.data.name;
            const wardRes = await axios.get(`https://provinces.open-api.vn/api/d/${district_id}?depth=2`);
            const wards = wardRes.data.wards || [];
            const wardData = wards.find(w => w.code.toString() === ward_id.toString());
            if (!wardData) {
                throw new Error(`Không tìm thấy phường/xã với ward_id: ${ward_id}`);
            }
            const ward = wardData.name;
            const full_address = `${street_address}, ${ward}, ${district}, ${province}`;
            let total_amount = await cartModel.getCartTotal(cartId);
            let discount_amount = 0;
            const voucher = await cartModel.getAppliedVoucher(cartId);
            if (voucher && total_amount >= voucher.min_order_value) {
                discount_amount = voucher.discount_amount;
            }
            let shipping_fee = 30000;
            const final_amount = total_amount - discount_amount + shipping_fee;
            const orderData = {
                user_id: userId,
                receiver_name: receiverName,
                receiver_phone: receiverPhone,
                total_amount,
                shipping_fee,
                discount_amount,
                final_amount,
                status_id: 1,
                payment_method_id: paymentMethodId,
                payment_status: 'pending',
                province_id,
                district_id,
                ward_id,
                full_address,
                note
            };
            const orderId = await orderModel.createOrder(orderData);
            await orderModel.createOrderItems(orderId, cartItems);
            await orderModel.updateProductStock(cartItems);
            await orderModel.clearCart(cartId);
            return await orderModel.getOrderById(orderId, userId);
        } catch (error) {
            console.error(`[OrderService] Lỗi trong createOrder: ${error.message}`);
            throw error;
        }
    },

    async getOrder(userId, orderId) {
        try {
            const order = await orderModel.getOrderById(orderId, userId);
            if (!order) {
                throw new Error('Đơn hàng không tồn tại hoặc không thuộc về người dùng');
            }
            return order;
        } catch (error) {
            console.error(`[OrderService] Lỗi khi lấy đơn hàng: ${error.message}`);
            throw error;
        }
    },

    async getAllOrders(status) {
        try {
            let where = '';
            let params = [];
            if (status === 'completed') {
                where = 'WHERE os.status = ?';
                params = ['Đã giao hàng'];
            } else if (status === 'pending') {
                where = 'WHERE os.status != ?';
                params = ['Đã giao hàng'];
            }
            const [orders] = await db.query(`
                SELECT o.order_id, o.created_at, o.final_amount, os.status, u.username, u.email, o.payment_status, pm.name as payment_method_name, o.full_address
                FROM orders o
                LEFT JOIN order_status os ON o.status_id = os.order_status_id
                LEFT JOIN users u ON o.user_id = u.user_id
                LEFT JOIN payment_methods pm ON o.payment_method_id = pm.payment_method_id
                ${where}
                ORDER BY o.created_at DESC
            `, params);
            return orders.map(order => ({
                ...order,
                created_at: new Date(order.created_at).toLocaleString('vi-VN'),
                final_amount: parseFloat(order.final_amount) || 0,
                status: order.status || 'Chờ xác nhận'
            }));
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy danh sách đơn hàng:', error);
            throw new Error('Không thể lấy danh sách đơn hàng: ' + error.message);
        }
    },

    async getOrderById(orderId) {
        try {
            const order = await orderModel.getOrderById(orderId);
            if (!order) {
                throw new Error('Không tìm thấy đơn hàng');
            }
            return order;
        } catch (error) {
            console.error(`[OrderService] Lỗi khi lấy đơn hàng theo ID: ${error.message}`);
            throw error;
        }
    },

    async updateOrderStatus(orderId, statusId) {
        try {
            const order = await orderModel.updateOrderStatus(orderId, statusId);
            if (!order) {
                throw new Error('Không tìm thấy đơn hàng để cập nhật');
            }
            return order;
        } catch (error) {
            console.error(`[OrderService] Lỗi khi cập nhật trạng thái đơn hàng: ${error.message}`);
            throw error;
        }
    },

    async deleteOrder(orderId) {
        try {
            const result = await orderModel.deleteOrder(orderId);
            if (!result) {
                throw new Error('Không tìm thấy đơn hàng để xóa');
            }
            return result;
        } catch (error) {
            console.error(`[OrderService] Lỗi khi xóa đơn hàng: ${error.message}`);
            throw error;
        }
    },

    async getAllStatuses() {
        try {
            const [statuses] = await db.query('SELECT * FROM order_status ORDER BY order_status_id');
            return statuses;
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy danh sách trạng thái:', error);
            throw new Error('Không thể lấy danh sách trạng thái: ' + error.message);
        }
    },

    async getActualRevenue() {
        try {
            const actualRevenue = await orderModel.getActualRevenue();
            return actualRevenue;
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy doanh thu thực tế:', error.message);
            throw new Error('Không thể lấy doanh thu thực tế: ' + error.message);
        }
    },

    async getExpectedRevenue() {
        try {
            const expectedRevenue = await orderModel.getExpectedRevenue();
            return expectedRevenue;
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy doanh thu dự kiến:', error.message);
            throw new Error('Không thể lấy doanh thu dự kiến: ' + error.message);
        }
    },

    async getOrdersByUserId(userId) {
        try {
            const orders = await orderModel.getOrdersByUserId(userId);
            if (!orders || orders.length === 0) {
                return [];
            }
            for (let order of orders) {
                for (let item of order.items) {
                    item.canReview = await this.canUserReviewProduct(userId, item.product_id);
                }
            }
            return orders.map(order => ({
                order_id: order.order_id,
                receiver_name: order.receiver_name,
                receiver_phone: order.receiver_phone,
                total_amount: parseFloat(order.total_amount) || 0,
                shipping_fee: parseFloat(order.shipping_fee) || 0,
                discount_amount: parseFloat(order.discount_amount) || 0,
                final_amount: parseFloat(order.final_amount) || 0,
                status: order.status_name || 'Chờ xác nhận',
                payment_method: order.payment_method_name || 'Không xác định',
                created_at: new Date(order.created_at).toLocaleString('vi-VN'),
                full_address: order.full_address || '',
                items: order.items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: parseFloat(item.price) || 0,
                    image_url: item.image_url || '',
                    canReview: item.canReview
                }))
            }));
        } catch (error) {
            console.error(`[OrderService] Lỗi khi lấy đơn hàng theo userId: ${error.message}`);
            throw new Error('Không thể lấy đơn hàng của người dùng: ' + error.message);
        }
    },

    async getUserOrders(userId, page, limit) {
        try {
            const offset = (page - 1) * limit;
    
            const [orders] = await db.query(
                `SELECT o.order_id, o.receiver_name, o.receiver_phone, o.total_amount, o.shipping_fee, o.discount_amount, o.final_amount, 
                        o.province_id, o.district_id, o.ward_id, o.full_address, o.note, o.created_at, os.status, pm.name AS payment_method,
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'product_id', oi.product_id,
                                'quantity', oi.quantity,
                                'price', COALESCE(oi.price, 0),
                                'name', COALESCE(p.name, 'Không xác định'),
                                'image_url', COALESCE(p.image_url, '')
                            )
                        ) AS items
                 FROM orders o
                 JOIN order_status os ON o.status_id = os.order_status_id
                 LEFT JOIN order_items oi ON o.order_id = oi.order_id
                 LEFT JOIN products p ON oi.product_id = p.product_id
                 LEFT JOIN payment_methods pm ON o.payment_method_id = pm.payment_method_id
                 WHERE o.user_id = ?
                 GROUP BY o.order_id
                 ORDER BY o.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, parseInt(limit), parseInt(offset)]
            );
    
            // Format orders and check review eligibility
            const formattedOrders = await Promise.all(orders.map(async (order) => {
                let items = [];
                try {
                    // Kiểm tra nếu order.items là null hoặc không hợp lệ
                    if (order.items && typeof order.items === 'string') {
                        items = JSON.parse(`[${order.items}]`);
                    }
                } catch (error) {
                    console.error(`Lỗi khi parse items cho order_id ${order.order_id}:`, error.message);
                    items = []; // Trả về mảng rỗng nếu parse thất bại
                }
    
                const itemsWithReviewStatus = await Promise.all(items.map(async (item) => {
                    const canReview = await this.canUserReviewProduct(userId, item.product_id);
                    return {
                        product_id: item.product_id || 0,
                        product_name: item.name || 'Không xác định',
                        quantity: item.quantity || 0,
                        price: parseFloat(item.price) || 0,
                        image_url: item.image_url || '',
                        canReview
                    };
                }));
    
                return {
                    order_id: order.order_id,
                    receiver_name: order.receiver_name || 'Không xác định',
                    receiver_phone: order.receiver_phone || 'Không xác định',
                    total_amount: parseFloat(order.total_amount) || 0,
                    shipping_fee: parseFloat(order.shipping_fee) || 0,
                    discount_amount: parseFloat(order.discount_amount) || 0,
                    final_amount: parseFloat(order.final_amount) || 0,
                    province_id: order.province_id || 'Không xác định',
                    district_id: order.district_id || 'Không xác định',
                    ward_id: order.ward_id || 'Không xác định',
                    full_address: order.full_address || 'Không xác định',
                    note: order.note || 'Không có ghi chú',
                    payment_method: order.payment_method || 'Không xác định',
                    created_at: new Date(order.created_at).toLocaleString('vi-VN'),
                    status: order.status || 'Chờ xác nhận',
                    items: itemsWithReviewStatus
                };
            }));
    
            return formattedOrders;
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy danh sách đơn hàng của người dùng:', error.message);
            throw new Error('Không thể lấy danh sách đơn hàng: ' + error.message);
        }
    },

    async getOrderDetails(userId, orderId) {
        try {
            const [order] = await db.query(
                `SELECT o.order_id, o.final_amount, o.created_at, os.status,
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'product_id', oi.product_id,
                                'quantity', oi.quantity,
                                'price', oi.price,
                                'name', p.name,
                                'image_url', p.image_url
                            )
                        ) AS items
                 FROM orders o
                 JOIN order_status os ON o.status_id = os.order_status_id
                 JOIN order_items oi ON o.order_id = oi.order_id
                 JOIN products p ON oi.product_id = p.product_id
                 WHERE o.user_id = ? AND o.order_id = ?
                 GROUP BY o.order_id`,
                [userId, orderId]
            );

            if (!order || order.length === 0) {
                return null;
            }

            const items = JSON.parse(`[${order[0].items}]`);
            const formattedItems = await Promise.all(items.map(async (item) => {
                const canReview = await this.canUserReviewProduct(userId, item.product_id);
                return {
                    product_id: item.product_id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price) || 0,
                    image_url: item.image_url || '',
                    canReview
                };
            }));

            return {
                order_id: order[0].order_id,
                final_amount: parseFloat(order[0].final_amount) || 0,
                created_at: new Date(order[0].created_at).toLocaleString('vi-VN'),
                status: order[0].status || 'Chờ xác nhận',
                items: formattedItems
            };
        } catch (error) {
            console.error('[OrderService] Lỗi khi lấy chi tiết đơn hàng:', error.message);
            throw new Error('Không thể lấy chi tiết đơn hàng: ' + error.message);
        }
    }
};

module.exports = orderService;