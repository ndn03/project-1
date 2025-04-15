const orderService = require('../services/order.service');
const cartModel = require('../models/cart.model');

const orderController = {
    async showCheckout(req, res) {
        try {
            const user = req.user; // Lấy từ authMiddleware
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
            const userId = req.user.user_id; // Lấy từ token (authMiddleware)
            const { cart_id, payment_method_id, shipping_address } = req.body;

            if (!cart_id || !payment_method_id || !shipping_address) {
                throw new Error('Thiếu thông tin cần thiết');
            }

            const order = await orderService.createOrder(userId, cart_id, payment_method_id, shipping_address);
            res.render('order-confirmation', { order });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getOrder(req, res) {
        try {
            const userId = req.user.user_id; // Lấy từ token (authMiddleware)
            const orderId = req.params.orderId;

            const order = await orderService.getOrder(userId, orderId);
            res.render('order-confirmation', { order });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = orderController;   