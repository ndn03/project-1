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
            const { code } = req.body;
            console.log("Received voucher code in controller:", code);
            const discountAmount = await cartService.applyVoucher(userId, code);
            res.status(200).json({
                message: 'Voucher đã được áp dụng',
                discount_amount: discountAmount
            });
        } catch (error) {
            console.error("Lỗi khi áp dụng voucher:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getCart(req, res) {
        try {
            if (!req.user || !req.user.user_id) {
                // Nếu là request AJAX, trả về JSON
                if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
                    return res.status(401).json({ message: "Vui lòng đăng nhập để xem giỏ hàng" });
                }
                // Nếu là truy cập trực tiếp, render trang đầy đủ
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
    
            // Nếu là request AJAX (từ fetch), chỉ render nội dung cart-content
            if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
                return res.status(200).render("cart-content", { cart }, (err, html) => {
                    if (err) {
                        return res.status(500).json({ message: "Lỗi server: " + err.message });
                    }
                    res.send(html);
                });
            }

            // Nếu là truy cập trực tiếp, render toàn bộ trang cart.ejs
            res.status(200).render("cart", { cart });
        } catch (error) {
            console.error("Lỗi server:", error);
            // Nếu là request AJAX, trả về JSON
            if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
                return res.status(500).json({ message: "Lỗi server: " + error.message });
            }
            // Nếu là truy cập trực tiếp, render trang lỗi
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
            if (!req.user || !req.user.user_id) {
                return res.status(401).json({ alert: "Alert: Không tìm thấy thông tin người dùng" });
            }
    
            const userId = req.user.user_id;
            const cartData = await cartService.getCart(userId);
            if (!cartData || !cartData.cart_id) {
                return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
            }
    
            // Trả về toàn bộ dữ liệu, bao gồm cart_items
            res.status(200).json(cartData); // Giả sử cartService.getCart trả về { cart_id, cart_items, ... }
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu giỏ hàng:", error);
            res.status(500).json({ error: error.message });
        }
    },
}

module.exports = cartController;