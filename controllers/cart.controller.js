const cartService = require('../services/cart.service');

const cartController = {
    async addToCart(req, res) {
        try {
            if (!req.user || !req.user.user_id) {
                return res.status(401).json({ alert: "Alert: Không tìm thấy thông tin người dùng" });
            }
            const userId = req.user.user_id;
            const { product_id, quantity } = req.body;
            const cartItemId = await cartService.addToCart(userId, product_id, quantity);
            res.status(201).json({
                message: 'Sản phẩm đã được thêm vào giỏ hàng',
                cart_item_id: cartItemId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async applyVoucher(req, res) {
        try {
            if (!req.user || !req.user.user_id) {
                return res.status(401).json({ alert: "Alert: Không tìm thấy thông tin người dùng" });
            }
            const userId = req.user.user_id;
            const { voucher_code } = req.body;
            const discountAmount = await cartService.applyVoucher(userId, voucher_code);
            res.status(200).json({
                message: 'Voucher đã được áp dụng',
                discount_amount: discountAmount
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getCart(req, res) {
        try {
            if (!req.user || !req.user.user_id) {
                return res.status(401).render("cart", { cart: { message: "Vui lòng đăng nhập để xem giỏ hàng" } });
            }
            const userId = req.user.user_id;
            const cartData = await cartService.getCart(userId);
    
            const cart = {
                cart_items: cartData.items,
                total: cartData.total,
                discount_amount: cartData.discount_amount,
                final_total: cartData.final_total
            };
    
            res.status(200).render("cart", { cart });
        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).render("cart", { cart: { message: "Lỗi server: " + error.message } });
        }
    },

    async updateCartItem(req, res) {
        try {
            if (!req.user || !req.user.user_id) {
                return res.status(401).json({ alert: "Alert: Không tìm thấy thông tin người dùng" });
            }
            const userId = req.user.user_id;
            const { cart_item_id, quantity } = req.body;
            await cartService.updateCartItem(userId, cart_item_id, quantity);
            res.status(200).json({ message: 'Số lượng sản phẩm đã được cập nhật' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async removeCartItem(req, res) {
        try {
            if (!req.user || !req.user.user_id) {
                return res.status(401).json({ alert: "Alert: Không tìm thấy thông tin người dùng" });
            }
            const userId = req.user.user_id;
            const { cartItemId } = req.params;
            await cartService.removeCartItem(userId, cartItemId);
            res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getCartData(req, res) {
        try {
            // Lấy dữ liệu từ database, ví dụ dùng Sequelize/Mongoose
            const cartItems = await Cart.findAll({ where: { user_id: req.user.user_id } });
            res.json({ items: cartItems }); // Trả về danh sách sản phẩm
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi lấy dữ liệu giỏ hàng" });
        }
    }
};


module.exports = cartController;