const UserService = require('../services/user.service');
const VoucherService = require('../services/user.service').VoucherService;

const getAllUsers = async (req, res) => {
    try {
        // Loại bỏ username và email khỏi filters
        const { role, isActive, sortBy } = req.query;
        const filters = { role, isActive, sortBy };
        const result = await UserService.getAllUsers(filters);
        res.json(result);
    } catch (error) {
        console.error('Lỗi trong getAllUsers controller:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách user' });
    }
};

const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await UserService.updateUserRole(id, role);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong updateUserRole controller:', error.message, error.stack, 'Body:', req.body);
        res.status(500).json({ error: 'Lỗi khi cập nhật vai trò', detail: error.message });
    }
};

const updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        await UserService.updateUserStatus(id, isActive);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong updateUserStatus controller:', error.message, error.stack, 'Body:', req.body);
        res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái', detail: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        await UserService.createUser(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong createUser controller:', error.message, error.stack, 'Body:', req.body);
        res.status(500).json({ error: 'Lỗi khi thêm user', detail: error.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await UserService.deleteUser(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi trong deleteUser controller:', error);
        res.status(500).json({ error: 'Lỗi khi xóa user' });
    }
};

const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await VoucherService.getAllVouchers();
        res.json(vouchers);
    } catch (error) {
        console.error('Lỗi trong getAllVouchers controller:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách voucher' });
    }
};

const getUserMeta = (req, res) => {
    // Enum role và trạng thái lấy từ DB hoặc hardcode đúng với DB
    res.json({
        roles: [
            { value: 'admin', label: 'Admin' },
            { value: 'customer', label: 'Khách hàng' }
        ],
        statuses: [
            { value: 1, label: 'Hoạt động' },
            { value: 0, label: 'Khoá' }
        ]
    });
};

module.exports = {
    getAllUsers,
    updateUserRole,
    updateUserStatus,
    createUser,
    deleteUser,
    getAllVouchers,
    getUserMeta
};