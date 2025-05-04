const db = require('../config/db');

const UserService = {
    getAllUsers: async (limit = 10, offset = 0) => {
        try {
            const [users] = await db.query(
                'SELECT user_id, username, email, role, isActive FROM users LIMIT ? OFFSET ?',
                [parseInt(limit), parseInt(offset)]
            );
            const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');
            return { users, total: countResult[0].total };
        } catch (error) {
            console.error('Lỗi khi lấy danh sách user:', error);
            throw new Error('Lỗi khi lấy danh sách user');
        }
    },
    updateUserRole: async (user_id, role) => {
        try {
            await db.query('UPDATE users SET role = ? WHERE user_id = ?', [role, user_id]);
        } catch (error) {
            console.error('Lỗi khi cập nhật vai trò:', error);
            throw new Error('Lỗi khi cập nhật vai trò');
        }
    },
    updateUserStatus: async (user_id, isActive) => {
        try {
            await db.query('UPDATE users SET isActive = ? WHERE user_id = ?', [isActive, user_id]);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            throw new Error('Lỗi khi cập nhật trạng thái');
        }
    },
    createUser: async ({ username, email, password, role, isActive }) => {
        try {
            await db.query(
                'INSERT INTO users (username, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)',
                [username, email, password, role, isActive]
            );
        } catch (error) {
            console.error('Lỗi khi thêm user:', error);
            throw new Error('Lỗi khi thêm user');
        }
    },
    deleteUser: async (user_id) => {
        try {
            await db.query('DELETE FROM users WHERE user_id = ?', [user_id]);
        } catch (error) {
            console.error('Lỗi khi xóa user:', error);
            throw new Error('Lỗi khi xóa user');
        }
    }
};

module.exports = UserService; 