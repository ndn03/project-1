const axios = require('axios');
const cartModel = require('../models/cart.model');
const orderModel = require('../models/order.model');
const db = require('../config/db');

const orderService = {
    async createOrder(userId, cartId, paymentMethodId, shippingAddress, receiverName, receiverPhone, note) {
        try {
            // 1. Kiểm tra giỏ hàng
            console.log(`[OrderService] Kiểm tra giỏ hàng với cartId: ${cartId}`);
            let cartItems;
            try {
                cartItems = await cartModel.getCartItems(cartId);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi lấy giỏ hàng: ${error.message}`);
                throw error;
            }
            if (cartItems.length === 0) {
                throw new Error('Giỏ hàng trống');
            }
            console.log(`[OrderService] Số lượng sản phẩm trong giỏ hàng: ${cartItems.length}`);

            // 2. Kiểm tra tồn kho
            console.log(`[OrderService] Kiểm tra tồn kho`);
            try {
                await orderModel.checkProductStock(cartItems);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi kiểm tra tồn kho: ${error.message}`);
                throw error;
            }

            // 3. Kiểm tra địa chỉ giao hàng
            const { province_id, district_id, ward_id, street_address } = shippingAddress;
            let province, district, ward;

            try {
                console.log(`[OrderService] Gọi API tỉnh: https://provinces.open-api.vn/api/p/${province_id}`);
                const provinceRes = await axios.get(`https://provinces.open-api.vn/api/p/${province_id}`);
                if (!provinceRes.data || !provinceRes.data.name) {
                    throw new Error(`Không tìm thấy tỉnh với province_id: ${province_id}`);
                }
                province = provinceRes.data.name;
                console.log(`[OrderService] Tỉnh: ${province}`);

                console.log(`[OrderService] Gọi API quận: https://provinces.open-api.vn/api/d/${district_id}`);
                const districtRes = await axios.get(`https://provinces.open-api.vn/api/d/${district_id}`);
                if (!districtRes.data || !districtRes.data.name) {
                    throw new Error(`Không tìm thấy quận với district_id: ${district_id}`);
                }
                district = districtRes.data.name;
                console.log(`[OrderService] Quận: ${district}`);

                console.log(`[OrderService] Gọi API danh sách phường: https://provinces.open-api.vn/api/d/${district_id}?depth=2`);
                const wardRes = await axios.get(`https://provinces.open-api.vn/api/d/${district_id}?depth=2`);
                const wards = wardRes.data.wards || [];
                if (wards.length === 0) {
                    throw new Error(`Không có phường/xã nào thuộc district_id: ${district_id}`);
                }

                const wardData = wards.find(w => w.code.toString() === ward_id.toString());
                if (!wardData) {
                    console.log(`[OrderService] Danh sách phường/xã của district_id ${district_id}:`, wards.map(w => ({ name: w.name, code: w.code })));
                    throw new Error(`Không tìm thấy phường/xã với ward_id: ${ward_id} trong district_id: ${district_id}`);
                }
                ward = wardData.name;
                console.log(`[OrderService] Phường: ${ward}`);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi gọi API địa chỉ: ${error.message}`);
                if (error.response) {
                    console.error('Status:', error.response.status);
                    console.error('Data:', error.response.data);
                }
                throw new Error(error.message || 'Địa chỉ không hợp lệ');
            }

            const full_address = `${street_address}, ${ward}, ${district}, ${province}`;
            console.log(`[OrderService] Địa chỉ đầy đủ: ${full_address}`);

            // 4. Tính toán tổng tiền
            console.log(`[OrderService] Tính tổng tiền`);
            let total_amount;
            try {
                total_amount = await cartModel.getCartTotal(cartId);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi tính tổng tiền: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Tổng tiền trước giảm giá: ${total_amount}`);

            let discount_amount = 0;
            console.log(`[OrderService] Kiểm tra voucher`);
            try {
                const voucher = await cartModel.getAppliedVoucher(cartId);
                if (voucher && total_amount >= voucher.min_order_value) {
                    discount_amount = voucher.discount_amount;
                }
            } catch (error) {
                console.error(`[OrderService] Lỗi khi kiểm tra voucher: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Tổng tiền: ${total_amount}, Giảm giá: ${discount_amount}`);

            // 5. (Tùy chọn) Tính phí vận chuyển
            let shipping_fee = 30000; // Giả lập phí vận chuyển
            console.log(`[OrderService] Phí vận chuyển: ${shipping_fee}`);

            const final_amount = total_amount - discount_amount + shipping_fee;
            console.log(`[OrderService] Thành tiền: ${final_amount}`);

            // 6. Tạo đơn hàng
            console.log(`[OrderService] Tạo đơn hàng`);
            let orderId;
            try {
                const orderData = {
                    user_id: userId,
                    receiver_name: receiverName,
                    receiver_phone: receiverPhone,
                    total_amount,
                    shipping_fee,
                    discount_amount,
                    final_amount,
                    status_id: 1, // "Đang xử lý"
                    payment_method_id: paymentMethodId,
                    payment_status: 'pending',
                    province_id,
                    district_id,
                    ward_id,
                    full_address,
                    note
                };
                orderId = await orderModel.createOrder(orderData);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi tạo đơn hàng: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Đơn hàng đã tạo với orderId: ${orderId}`);

            // 7. Tạo chi tiết đơn hàng
            console.log(`[OrderService] Tạo chi tiết đơn hàng`);
            try {
                await orderModel.createOrderItems(orderId, cartItems);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi tạo chi tiết đơn hàng: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Đã tạo chi tiết đơn hàng`);

            // 8. Cập nhật tồn kho
            console.log(`[OrderService] Cập nhật tồn kho`);
            try {
                await orderModel.updateProductStock(cartItems);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi cập nhật tồn kho: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Đã cập nhật tồn kho`);

            // 9. Xóa giỏ hàng
            console.log(`[OrderService] Xóa giỏ hàng`);
            try {
                await orderModel.clearCart(cartId);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi xóa giỏ hàng: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Đã xóa giỏ hàng`);

            // 10. Trả về đơn hàng
            console.log(`[OrderService] Lấy thông tin đơn hàng`);
            let order;
            try {
                order = await orderModel.getOrderById(orderId, userId);
            } catch (error) {
                console.error(`[OrderService] Lỗi khi lấy thông tin đơn hàng: ${error.message}`);
                throw error;
            }
            console.log(`[OrderService] Đã lấy thông tin đơn hàng: ${order.order_id}`);
            return order;
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
            console.log('[OrderService] Bắt đầu lấy danh sách đơn hàng');
            let where = '';
            let params = [];
            if (status === 'completed') {
                where = 'WHERE os.status = ?';
                params = ['Hoàn thành'];
            } else if (status === 'pending') {
                where = 'WHERE os.status != ?';
                params = ['Hoàn thành'];
            } else {
                where = '';
                params = [];
            }
            const [orders] = await db.query(`
                SELECT 
                    o.order_id,
                    o.created_at,
                    o.final_amount,
                    o.status_id,
                    os.status,
                    u.username,
                    u.email,
                    o.payment_status,
                    pm.name as payment_method_name,
                    o.full_address
                FROM orders o
                LEFT JOIN order_status os ON o.status_id = os.order_status_id
                LEFT JOIN users u ON o.user_id = u.user_id
                LEFT JOIN payment_methods pm ON o.payment_method_id = pm.payment_method_id
                ${where}
                ORDER BY o.created_at DESC
            `, params);

            console.log('[OrderService] Số lượng đơn hàng:', orders?.length || 0);

            if (!orders || orders.length === 0) {
                return [];
            }

            const formattedOrders = orders.map(order => ({
                ...order,
                created_at: new Date(order.created_at).toLocaleString('vi-VN'),
                final_amount: parseFloat(order.final_amount) || 0,
                status: order.status || 'Chờ xử lý'
            }));

            console.log('[OrderService] Đã format dữ liệu đơn hàng');
            return formattedOrders;
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
    }
};

module.exports = orderService;