const orderService = require('../services/order.service');
const cartModel = require('../models/cart.model');

const orderController = {
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

            console.log(`[OrderController] Lấy đơn hàng với orderId: ${orderId}, userId: ${userId}`);
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
            const status = req.query.status;
            const orders = await orderService.getAllOrders(status);
            res.json(orders);
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy danh sách đơn hàng:', error.message);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message });
        }
    },

    async getOrderById(req, res) {
        try {
            const orderId = req.params.id;
            const order = await orderService.getOrderById(orderId);
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

            if (!product_id || !rating || rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Thiếu hoặc thông tin đánh giá không hợp lệ' });
            }

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
            console.log(`[OrderController] Lấy đơn hàng cho userId: ${userId}`);

            const orders = await orderService.getOrdersByUserId(userId);
            if (!orders || orders.length === 0) {
                return res.status(200).json({ message: 'Không có đơn hàng nào', orders: [] });
            }

            const acceptHeader = req.get('Accept');
            if (acceptHeader && acceptHeader.includes('text/html')) {
                res.render('order-history', { orders, user: req.user });
            } else {
                res.json(orders);
            }
        } catch (error) {
            console.error('[OrderController] Lỗi khi lấy đơn hàng của user:', error.message);
            res.status(500).json({ error: 'Lỗi khi lấy đơn hàng: ' + error.message });
        }
    },
};

module.exports = orderController;