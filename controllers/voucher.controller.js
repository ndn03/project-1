const VoucherService = require('../services/voucher.service');

const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await VoucherService.getAllVouchers();
        res.json(vouchers);
    } catch (error) {
        console.error('Lỗi trong getAllVouchers controller:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách voucher' });
    }
};

const createVoucher = async (req, res) => {
    try {
        await VoucherService.createVoucher(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong createVoucher controller:', error);
        res.status(500).json({ error: 'Lỗi khi thêm voucher' });
    }
};

const updateVoucher = async (req, res) => {
    try {
        await VoucherService.updateVoucher(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong updateVoucher controller:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật voucher' });
    }
};

const deleteVoucher = async (req, res) => {
    try {
        await VoucherService.deleteVoucher(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong deleteVoucher controller:', error);
        res.status(500).json({ error: 'Lỗi khi xóa voucher' });
    }
};

module.exports = {
    getAllVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher
}; 