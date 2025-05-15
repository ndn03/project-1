const db = require('../config/db');

const UserService = {
    getAllUsers: async (filters = {}) => {
        try {
            let sql = 'SELECT user_id, username, full_name, email, role, isActive, created_at, updated_at FROM users WHERE 1=1';
            const params = [];
            if (filters.role) {
                sql += ' AND role = ?';
                params.push(filters.role);
            }
            if (filters.isActive !== undefined && filters.isActive !== "") {
                sql += ' AND isActive = ?';
                params.push(filters.isActive);
            }
            if (filters.sortBy === 'created_at_asc') {
                sql += ' ORDER BY created_at ASC';
            } else {
                sql += ' ORDER BY created_at DESC';
            }
            const [users] = await db.query(sql, params);
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