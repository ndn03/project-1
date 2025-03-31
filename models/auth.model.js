const pool = require("../config/db");
const bcrypt = require("bcrypt");

const UserModel = {
    // Đăng ký người dùng mới
    async register(full_name, username, email, password, role = "customer") {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Kiểm tra username hoặc email đã tồn tại chưa
            const [existingUser] = await connection.execute(
                "SELECT id FROM users WHERE username = ? OR email = ?",
                [username, email]
            );

            if (existingUser.length > 0) {
                throw new Error("Username hoặc email đã được sử dụng!");
            }

            // Hash mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo user
            const [userResult] = await connection.execute(
                "INSERT INTO users (full_name, username, email, password, role, isActive) VALUES (?, ?, ?, ?, ?, 1)",
                [full_name, username, email, hashedPassword, role]
            );

            const userId = userResult.insertId;

            // Tạo profile mặc định
            await connection.execute(
                "INSERT INTO user_profiles (user_id, avatar, total_purchased) VALUES (?, ?, ?)",
                [userId, "default_avatar.png", 0]
            );

            await connection.commit();
            return { id: userId, full_name, username, email, role };
        } catch (error) {
            await connection.rollback();
            console.error("Lỗi khi đăng ký:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Tìm user theo username (chỉ lấy user đang active)
    async findByUsername(username) {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM users WHERE username = ? AND isActive = 1",
                [username]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Lỗi trong findByUsername:", error);
            throw error;
        }
    },

    // Tìm user theo email (chỉ lấy user đang active)
    async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM users WHERE email = ? AND isActive = 1",
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Lỗi trong findByEmail:", error);
            throw error;
        }
    },

    // Tìm user theo ID (bao gồm profile, chỉ lấy user đang active)
    async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT u.*, p.avatar, p.total_purchased 
                 FROM users u 
                 LEFT JOIN user_profiles p ON u.id = p.user_id 
                 WHERE u.id = ? AND u.isActive = 1`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Lỗi trong findById:", error);
            throw error;
        }
    },

    // Lưu refresh token vào user
    async saveRefreshToken(userId, refreshToken) {
        try {
            await pool.execute(
                "UPDATE users SET refresh_token = ? WHERE id = ?",
                [refreshToken, userId]
            );
        } catch (error) {
            console.error("Lỗi trong saveRefreshToken:", error);
            throw error;
        }
    },

    // Tìm user theo refresh token (chỉ lấy user đang active)
    async findByRefreshToken(refreshToken) {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM users WHERE refresh_token = ? AND isActive = 1",
                [refreshToken]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Lỗi trong findByRefreshToken:", error);
            throw error;
        }
    },

    // Xóa refresh token khi logout
    async clearRefreshToken(userId) {
        try {
            await pool.execute(
                "UPDATE users SET refresh_token = NULL WHERE id = ?",
                [userId]
            );
        } catch (error) {
            console.error("Lỗi trong clearRefreshToken:", error);
            throw error;
        }
    }
};

module.exports = UserModel;
