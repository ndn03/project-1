const orderService = require('../services/order.service');
const cartModel = require('../models/cart.model');

const orderController = {
    async getUserOrders(req, res) {
        try {
            const userId = req.user.user_id;
            const { page = 1, limit = 10 } = req.query;

            const orders = await orderService.getUserOrders(userId, page, limit);
            res.status(200).json(orders);
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy danh sách đơn hàng của người dùng:', error.message);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message });
        }
    },

    async showCheckout(req, res) {
        try {
            const user = req.user;
            const cartId = req.query.cartId;

            if (!cartId) {
                throw new Error('Thiếu cartId');
            }

            const cartItems = await cartModel.getCartItems(cartId);
            if (cartItems.length === 0) {
                throw new Error('Giỏ hàng trống');
            }

            const total = await cartModel.getCartTotal(cartId);
            res.render('checkout', { user, cartItems, total, cartId });
        } catch (error) {
            console.error('[OrderController] Lỗi khi hiển thị checkout:', error.message);
            res.status(400).json({ error: error.message });
        }
    },

    async createOrder(req, res) {
        try {
            const userId = req.user.user_id;
            const { cart_id, payment_method_id, shipping_address, receiver_name, receiver_phone, note } = req.body;

            if (!cart_id || !payment_method_id || !shipping_address || !receiver_name || !receiver_phone) {
                return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
            }

            const order = await orderService.createOrder(
                userId, cart_id, payment_method_id, shipping_address, receiver_name, receiver_phone, note
            );

            return res.status(201).json({ message: "Đặt hàng thành công", order });
        } catch (error) {
            console.error('[OrderController] Lỗi khi tạo đơn hàng:', error.message);
            return res.status(400).json({ error: error.message });
        }
    },

    async getOrder(req, res) {
        try {
            const userId = req.user.user_id;
            const orderId = req.params.orderId;

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({ error: 'orderId không hợp lệ' });
            }

            const order = await orderService.getOrder(userId, orderId);
            if (!order) {
                return res.status(404).json({ error: 'Đơn hàng không tồn tại hoặc không thuộc về bạn.' });
            }
            res.render('order-confirmation', { order });
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy đơn hàng:', error.message);
            res.status(500).json({ error: `Lỗi khi lấy đơn hàng: ${error.message}` });
        }
    },

   async getAllOrders(req, res) {
    try {
        const { status_id, sortBy, payment_method_id } = req.query;
        const filters = { status_id, sortBy, payment_method_id };
        console.log('[getAllOrders] Filters:', filters);
        const { orders, total } = await orderService.getAllOrders(filters);
        res.json({
            orders: orders || [],
            total: total || 0
        });
    } catch (error) {
        console.error('[OrderController] Lỗi khi lấy danh sách đơn hàng:', error.message);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message });
    }
},
    async getOrderById(req, res) {
        try {
            const orderId = req.params.id;
            const order = await orderService.getOrderById(orderId);
            if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
            res.json(order);
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy chi tiết đơn hàng:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    async updateOrderStatus(req, res) {
        try {
            const orderId = req.params.id;
            const { status_id } = req.body;

            if (!status_id) {
                throw new Error('Thiếu trạng thái đơn hàng');
            }

            const order = await orderService.updateOrderStatus(orderId, status_id);
            res.json({ message: "Cập nhật trạng thái đơn hàng thành công", order });
        } catch (error) {
            console.error('[OrderController] Lỗi khi cập nhật trạng thái đơn hàng:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    async deleteOrder(req, res) {
        try {
            const orderId = req.params.id;
            await orderService.deleteOrder(orderId);
            res.json({ message: "Xóa đơn hàng thành công" });
        } catch (error) {
            console.error('[OrderController] Lỗi khi xóa đơn hàng:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    async getAllStatuses(req, res) {
        try {
            const statuses = await orderService.getAllStatuses();
            res.json(statuses);
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy danh sách trạng thái:', error.message);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách trạng thái: ' + error.message });
        }
    },

    async getRevenue(req, res) {
        try {
            const actualRevenue = await orderService.getActualRevenue();
            const expectedRevenue = await orderService.getExpectedRevenue();

            res.status(200).json({
                actualRevenue: parseFloat(actualRevenue) || 0,
                expectedRevenue: parseFloat(expectedRevenue) || 0
            });
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy doanh thu:', error.message);
            res.status(500).json({ error: 'Không thể lấy thông tin doanh thu: ' + error.message });
        }
    },

    async createReview(req, res) {
        try {
            const userId = req.user.user_id;
            const { product_id, rating, comment } = req.body;

            if (!product_id) {
                return res.status(400).json({ error: 'Thiếu product_id' });
            }
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Rating không hợp lệ (phải từ 1 đến 5)' });
            }
            if (!comment || comment.trim() === '') {
                return res.status(400).json({ error: 'Thiếu comment' });
            }

            // const hasReviewed = await orderService.hasUserReviewedProduct(userId, product_id);
            // if (hasReviewed) {
            //     return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
            // }

            const review = await orderService.createReview(userId, product_id, rating, comment);
            res.status(201).json({ message: 'Đánh giá sản phẩm thành công', review });
        } catch (error) {
            console.error('[OrderController] Lỗi khi tạo đánh giá:', error.message);
            res.status(400).json({ error: error.message });
        }
    },

    async getOrdersByUserId(req, res) {
        try {
            const userId = req.user.user_id;
            const orders = await orderService.getOrdersByUserId(userId);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi lấy đơn hàng: ' + error.message });
        }
    },

    async reviewCompletedOrder(req, res) {
        try {
            const userId = req.user.user_id;
            const { orderId } = req.params;
            const { rating, comment } = req.body;

            if (!rating || !comment) {
                return res.status(400).json({ message: "Rating and comment are required." });
            }

            const result = await orderService.addOrderReview(userId, orderId, rating, comment);
            res.status(201).json({
                message: "Review added successfully.",
                result
            });
        } catch (error) {
            console.error("[reviewCompletedOrder] Error while adding review:", error);
            res.status(500).json({
                message: "Server error while adding review.",
                error: error.message
            });
        }
    },

    async getOrderDetails(req, res) {
        try {
            const userId = req.user.user_id;
            const orderId = req.params.orderId;

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({ error: 'orderId không hợp lệ' });
            }

            const orderDetails = await orderService.getOrderDetails(userId, orderId);
            if (!orderDetails) {
                return res.status(404).json({ error: 'Đơn hàng không tồn tại hoặc không thuộc về bạn.' });
            }

            res.status(200).json(orderDetails);
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy chi tiết đơn hàng:', error.message);
            res.status(500).json({ error: `Lỗi khi lấy chi tiết đơn hàng: ${error.message}` });
        }
    }
};

module.exports = orderController;