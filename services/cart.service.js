const cartModel = require('../models/cart.model');

const cartService = {
    async addToCart(userId, productId, quantity) {
        if (!productId || !quantity || quantity <= 0) {
            throw new Error('Invalid product or quantity');
        }

        const userExists = await cartModel.checkUserExists(userId);
        if (!userExists) throw new Error('Người dùng không tồn tại');

        const product = await cartModel.getProduct(productId);
        if (!product) throw new Error('Sản phẩm không tồn tại');
        if (product.stock_quantity < quantity) {
            throw new Error('Số lượng vượt quá tồn kho');
        }

        const cartId = await cartModel.getOrCreateCart(userId);
        const cartItemId = await cartModel.addOrUpdateItem(cartId, productId, quantity, product.price);
        return cartItemId;
    },

    async applyVoucher(userId, voucherCode) {
        if (!voucherCode) throw new Error('Mã voucher không được để trống');

        const userExists = await cartModel.checkUserExists(userId);
        if (!userExists) throw new Error('Người dùng không tồn tại');

        const cartId = await cartModel.getOrCreateCart(userId);
        const voucher = await cartModel.getVoucher(voucherCode);
        if (!voucher) throw new Error('Voucher không hợp lệ hoặc đã hết hạn');

        const total = await cartModel.getCartTotal(cartId);
        if (total < voucher.min_order_value) {
            throw new Error(`Đơn hàng phải đạt tối thiểu ${voucher.min_order_value.toLocaleString('vi-VN')} VND để áp dụng voucher`);
        }

        await cartModel.applyVoucher(cartId, voucherCode);
        return voucher.discount_amount;
    },

    async getCart(userId) {
        if (!userId) {
            throw new Error('Người dùng không tồn tại');
        }
        const userExists = await cartModel.checkUserExists(userId);
        if (!userExists) throw new Error('Người dùng không tồn tại');
        const cartId = await cartModel.getOrCreateCart(userId);
        const items = await cartModel.getCartItems(cartId);
        const paymentMethods = await cartModel.getPaymentMethods(); // Dòng ~50
        if (items.length === 0) return { cart_id: cartId, message: 'Giỏ hàng trống', payment_methods: paymentMethods };
        let total = await cartModel.getCartTotal(cartId);
        const voucher = await cartModel.getAppliedVoucher(cartId);
        let discountAmount = 0;
        if (voucher && total >= voucher.min_order_value) {
            discountAmount = voucher.discount_amount;
        }
        const finalTotal = total - discountAmount;
        return {
            cart_id: cartId,
            items: items.map(item => ({
                cart_item_id: item.cart_item_id,
                product_id: item.product_id,
                name: item.product_name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.quantity * item.price,
                image_url: item.image_url
            })),
            total: total,
            discount_amount: discountAmount,
            final_total: finalTotal,
            payment_methods: paymentMethods
        };
    },

    async updateCartItem(userId, cartItemId, quantity) {
        if (!cartItemId || !quantity || quantity <= 0) {
            throw new Error('Invalid cart item ID or quantity');
        }

        const userExists = await cartModel.checkUserExists(userId);
        if (!userExists) throw new Error('Người dùng không tồn tại');

        const cartId = await cartModel.getOrCreateCart(userId);
        const affectedRows = await cartModel.updateItemQuantity(cartId, cartItemId, quantity);
        if (!affectedRows) {
            throw new Error('Mục không tồn tại trong giỏ hàng');
        }

        return true;
    },

    async removeCartItem(userId, cartItemId) {
        if (!cartItemId) throw new Error('Invalid cart item ID');

        const userExists = await cartModel.checkUserExists(userId);
        if (!userExists) throw new Error('Người dùng không tồn tại');

        const cartId = await cartModel.getOrCreateCart(userId);
        const affectedRows = await cartModel.deleteItem(cartId, cartItemId);
        if (!affectedRows) {
            throw new Error('Mục không tồn tại trong giỏ hàng');
        }

        return true;
    },
    async getCart(userId) {
    if (!userId) {
        throw new Error('Người dùng không tồn tại');
    }
    const userExists = await cartModel.checkUserExists(userId);
    if (!userExists) throw new Error('Người dùng không tồn tại');
    const cartId = await cartModel.getOrCreateCart(userId);
    const items = await cartModel.getCartItems(cartId);
    const paymentMethods = await cartModel.getPaymentMethods();
    if (items.length === 0) {
        return {
            cart_id: cartId,
            message: 'Giỏ hàng trống',
            payment_methods: paymentMethods
        };
    }
    let total = await cartModel.getCartTotal(cartId);
    const voucher = await cartModel.getAppliedVoucher(cartId);
    let discountAmount = 0;
    if (voucher && total >= voucher.min_order_value) {
        discountAmount = voucher.discount_amount;
    }
    const finalTotal = total - discountAmount;
    return {
        cart_id: cartId,
        items: items.map(item => ({
            cart_item_id: item.cart_item_id,
            product_id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
            image_url: item.image_url
        })),
        total: total,
        discount_amount: discountAmount,
        final_total: finalTotal,
        payment_methods: paymentMethods
    };
}
};

module.exports = cartService;