const pool = require("../config/db");
const bcrypt = require("bcrypt");

const UserModel = {
    // Đăng ký người dùng mới
    async register(full_name, username, email, password, role = "customer") {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [existingUser] = await connection.execute(
                "SELECT id FROM users WHERE username = ? OR email = ?",
                [username, email]
            );
            if (existingUser.length > 0) {
                throw new Error("Username hoặc email đã được sử dụng!");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const [userResult] = await connection.execute(
                "INSERT INTO users (full_name, username, email, password, role, isActive) VALUES (?, ?, ?, ?, ?, 1)",
                [full_name, username, email, hashedPassword, role]
            );
            const userId = userResult.insertId;

            await connection.execute(
                "INSERT INTO user_profiles (user_id, avatar, total_purchased) VALUES (?, ?, ?)",
                [userId, "default_avatar.png", 0]
            );

            await connection.commit();
            return { id: userId, full_name, username, email, role };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Tìm user theo username
    async findByUsername(username) {
        if (!username) throw new Error("Username không được để trống");
        try {
            const [rows] = await pool.execute(
                "SELECT id, username, full_name, email, password, role FROM users WHERE username = ? AND isActive = 1",
                [username]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo username: ${error.message}`);
        }
    },

    // Tìm user theo email
    async findByEmail(email) {
        if (!email) throw new Error("Email không được để trống");
        try {
            const [rows] = await pool.execute(
                "SELECT id, username, full_name, email, password, role FROM users WHERE email = ? AND isActive = 1",
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo email: ${error.message}`);
        }
    },

    // Tìm user theo ID (bao gồm profile)
    async findById(id) {
        if (!id) throw new Error("ID không được để trống");
        try {
            const [rows] = await pool.execute(
                `SELECT u.id, u.username, u.full_name, u.email, u.password, u.role, 
                        p.avatar, p.total_purchased 
                 FROM users u 
                 LEFT JOIN user_profiles p ON u.id = p.user_id 
                 WHERE u.id = ? AND u.isActive = 1`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo ID: ${error.message}`);
        }
    },

    // Lưu refresh token
    async saveRefreshToken(userId, refreshToken) {
        if (!userId || !refreshToken) throw new Error("User ID hoặc refresh token không được để trống");
        try {
            await pool.execute(
                "UPDATE users SET refresh_token = ? WHERE id = ?",
                [refreshToken, userId]
            );
        } catch (error) {
            throw new Error(`Lỗi lưu refresh token: ${error.message}`);
        }
    },

    // Tìm user theo refresh token
    async findByRefreshToken(refreshToken) {
        if (!refreshToken) throw new Error("Refresh token không được để trống");
        try {
            const [rows] = await pool.execute(
                "SELECT id, username, full_name, email, password, role, refresh_token FROM users WHERE refresh_token = ? AND isActive = 1",
                [refreshToken]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo refresh token: ${error.message}`);
        }
    },

    // Xóa refresh token
    async clearRefreshToken(userId) {
        if (!userId) throw new Error("User ID không được để trống");
        try {
            await pool.execute(
                "UPDATE users SET refresh_token = NULL WHERE id = ?",
                [userId]
            );
        } catch (error) {
            throw new Error(`Lỗi xóa refresh token: ${error.message}`);
        }
    },
};

module.exports = UserModel;