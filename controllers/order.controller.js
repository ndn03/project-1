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
            return res.status(400).json({ error: error.message });
        }
    },

    async getOrder(req, res) {
        try {
            const userId = req.user.user_id;
            const orderId = req.params.orderId;

            const order = await orderService.getOrder(userId, orderId);
            res.render('order-confirmation', { order });
        } catch (error) {
            console.error("Lỗi khi lấy đơn hàng:", error);
            res.status(500).json({ error: error.message });
        }
    },

    getAllOrders: async (req, res) => {
        try {
            const status = req.query.status;
            const orders = await orderService.getAllOrders(status);
            res.json(orders); // Trả về JSON thay vì render view
        } catch (error) {
            console.error("Lỗi khi lấy danh sách đơn hàng:", error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng' });
        }
    },

    async getOrderById(req, res) {
        try {
            const orderId = req.params.id;
            const order = await orderService.getOrderById(orderId);
            res.json(order);
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
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
            console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async deleteOrder(req, res) {
        try {
            const orderId = req.params.id;
            await orderService.deleteOrder(orderId);
            res.json({ message: "Xóa đơn hàng thành công" });
        } catch (error) {
            console.error("Lỗi khi xóa đơn hàng:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getAllStatuses(req, res) {
        try {
            const statuses = await orderService.getAllStatuses();
            res.json(statuses);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách trạng thái:", error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách trạng thái' });
        }
    },

    async getRevenue(req, res) {
        try {
            const actualRevenue = await orderModel.getActualRevenue();
            const expectedRevenue = await orderModel.getExpectedRevenue();

            res.status(200).json({
                actualRevenue,
                expectedRevenue
            });
        } catch (error) {
            console.error('Lỗi khi lấy doanh thu:', error);
            res.status(500).json({ error: 'Không thể lấy thông tin doanh thu' });
        }
    },
};

module.exports = orderController;