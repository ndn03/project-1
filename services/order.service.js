const axios = require('axios');
const cartModel = require('../models/cart.model');
const orderModel = require('../models/order.model');

const orderService = {
    async createOrder(userId, cartId, paymentMethodId, shippingAddress) {
        // 1. Kiểm tra giỏ hàng
        console.log(`[OrderService] Kiểm tra giỏ hàng với cartId: ${cartId}`);
        const cartItems = await cartModel.getCartItems(cartId);
        if (cartItems.length === 0) {
            throw new Error('Giỏ hàng trống');
        }
        console.log(`[OrderService] Số lượng sản phẩm trong giỏ hàng: ${cartItems.length}`);

        // 2. Kiểm tra tồn kho
        console.log(`[OrderService] Kiểm tra tồn kho`);
        await orderModel.checkProductStock(cartItems);

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
            console.error('Lỗi khi gọi API tỉnh thành:', error.message);
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
        let total_amount = await cartModel.getCartTotal(cartId);
        console.log(`[OrderService] Tổng tiền trước giảm giá: ${total_amount}`);

        let discount_amount = 0;
        console.log(`[OrderService] Kiểm tra voucher`);
        const voucher = await cartModel.getAppliedVoucher(cartId);
        if (voucher && total_amount >= voucher.min_order_value) {
            discount_amount = voucher.discount_amount;
        }
        console.log(`[OrderService] Tổng tiền: ${total_amount}, Giảm giá: ${discount_amount}`);

        // 5. (Tùy chọn) Tính phí vận chuyển
        let shipping_fee = 30000; // Giả lập phí vận chuyển
        console.log(`[OrderService] Phí vận chuyển: ${shipping_fee}`);

        const final_amount = total_amount - discount_amount + shipping_fee;
        console.log(`[OrderService] Thành tiền: ${final_amount}`);

        // 6. Tạo đơn hàng
        console.log(`[OrderService] Tạo đơn hàng`);
        const orderData = {
            user_id: userId,
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
            full_address
        };

        const orderId = await orderModel.createOrder(orderData);
        console.log(`[OrderService] Đơn hàng đã tạo với orderId: ${orderId}`);

        // 7. Tạo chi tiết đơn hàng
        console.log(`[OrderService] Tạo chi tiết đơn hàng`);
        await orderModel.createOrderItems(orderId, cartItems);
        console.log(`[OrderService] Đã tạo chi tiết đơn hàng`);

        // 8. Cập nhật tồn kho
        console.log(`[OrderService] Cập nhật tồn kho`);
        await orderModel.updateProductStock(cartItems);
        console.log(`[OrderService] Đã cập nhật tồn kho`);

        // 9. Xóa giỏ hàng
        console.log(`[OrderService] Xóa giỏ hàng`);
        await orderModel.clearCart(cartId);
        console.log(`[OrderService] Đã xóa giỏ hàng`);

        // 10. Trả về đơn hàng
        console.log(`[OrderService] Lấy thông tin đơn hàng`);
        const order = await orderModel.getOrderById(orderId, userId);
        console.log(`[OrderService] Đã lấy thông tin đơn hàng: ${order.order_id}`);
        return order;
    },

    async getOrder(userId, orderId) {
        const order = await orderModel.getOrderById(orderId, userId);
        if (!order) {
            throw new Error('Đơn hàng không tồn tại hoặc không thuộc về người dùng');
        }
        return order;
    }
};

module.exports = orderService;