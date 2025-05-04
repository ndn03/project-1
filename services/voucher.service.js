const db = require('../config/db');

const VoucherService = {
    getAllVouchers: async () => {
        try {
            const [vouchers] = await db.query(
                'SELECT voucher_id, code, discount_amount, min_order_value, start_date, end_date, usage_limit, created_at, updated_at FROM vouchers'
            );
            return vouchers;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách voucher:', error);
            throw new Error('Lỗi khi lấy danh sách voucher');
        }
    },
    createVoucher: async (voucher) => {
        try {
            const { code, discount_amount, min_order_value, start_date, end_date, usage_limit } = voucher;
            await db.query(
                'INSERT INTO vouchers (code, discount_amount, min_order_value, start_date, end_date, usage_limit) VALUES (?, ?, ?, ?, ?, ?)',
                [code, discount_amount, min_order_value, start_date, end_date, usage_limit]
            );
        } catch (error) {
            console.error('Lỗi khi thêm voucher:', error);
            throw new Error('Lỗi khi thêm voucher');
        }
    },
    updateVoucher: async (id, voucher) => {
        try {
            const { code, discount_amount, min_order_value, start_date, end_date, usage_limit } = voucher;
            await db.query(
                'UPDATE vouchers SET code=?, discount_amount=?, min_order_value=?, start_date=?, end_date=?, usage_limit=? WHERE voucher_id=?',
                [code, discount_amount, min_order_value, start_date, end_date, usage_limit, id]
            );
        } catch (error) {
            console.error('Lỗi khi cập nhật voucher:', error);
            throw new Error('Lỗi khi cập nhật voucher');
        }
    },
    deleteVoucher: async (id) => {
        try {
            await db.query('DELETE FROM vouchers WHERE voucher_id=?', [id]);
        } catch (error) {
            console.error('Lỗi khi xóa voucher:', error);
            throw new Error('Lỗi khi xóa voucher');
        }
    }
};

module.exports = VoucherService; 