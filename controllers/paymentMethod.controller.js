const PaymentMethodService = require('../services/paymentMethod.service');

const getAll = async (req, res) => {
    try {
        const data = await PaymentMethodService.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách phương thức thanh toán' });
    }
};

const create = async (req, res) => {
    try {
        const data = await PaymentMethodService.create(req.body);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi thêm phương thức thanh toán' });
    }
};

const update = async (req, res) => {
    try {
        const data = await PaymentMethodService.update(req.params.id, req.body);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật phương thức thanh toán' });
    }
};

const remove = async (req, res) => {
    try {
        await PaymentMethodService.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa phương thức thanh toán' });
    }
};

module.exports = { getAll, create, update, remove }; 