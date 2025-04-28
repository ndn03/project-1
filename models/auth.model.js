const pool = require("../config/db");
const bcrypt = require("bcrypt");

const UserModel = {
    // Đăng ký người dùng mới
    async register(full_name, username, email, password, role = "customer") {
        if (!full_name || !username || !email || !password) {
            throw new Error("Vui lòng cung cấp đầy đủ thông tin (họ tên, username, email, mật khẩu)");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Email không hợp lệ");
        }
        if (username.length > 50 || full_name.length > 100 || email.length > 100) {
            throw new Error("Độ dài thông tin vượt quá giới hạn cho phép");
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [existingUser] = await connection.execute(
                "SELECT user_id FROM users WHERE username = ? OR email = ?",
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

            const [profileResult] = await connection.execute(
                "INSERT INTO user_profiles (user_id, avatar, total_purchased) VALUES (?, ?, ?)",
                [userId, "default_avatar.png", 0]
            );
            if (profileResult.affectedRows === 0) {
                throw new Error("Không thể tạo profile cho người dùng");
            }

            await connection.commit();
            return { user_id: userId, full_name, username, email, role };
        } catch (error) {
            await connection.rollback();
            if (error.code === "ER_DUP_ENTRY") {
                throw new Error("Username hoặc email đã được sử dụng!");
            }
            throw new Error("Lỗi khi đăng ký: " + error.message);
        } finally {
            connection.release();
        }
    },

    // Tìm user theo username
    async findByUsername(username) {
        if (!username) throw new Error("Username không được để trống");
        try {
            const [rows] = await pool.execute(
                "SELECT user_id, username, full_name, email, password, role FROM users WHERE username = ? AND isActive = 1",
                [username]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo username: ${error.message}`);
        }
    },

    // Tìm user theo email
    async findByEmail(email) {
        if (!email) throw new Error("Email không được để trống");
        try {
            const [rows] = await pool.execute(
                "SELECT user_id, username, full_name, email, password, role FROM users WHERE email = ? AND isActive = 1",
                [email]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo email: ${error.message}`);
        }
    },

    // Tìm user theo ID (bao gồm profile)
    async findById(user_id) {
        if (!user_id || isNaN(user_id)) throw new Error("User ID phải là số hợp lệ");
        try {
            const [rows] = await pool.execute(
                `SELECT u.user_id, u.username, u.full_name, u.email, u.password, u.role, 
                        p.avatar, p.total_purchased 
                 FROM users u 
                 LEFT JOIN user_profiles p ON u.user_id = p.user_id 
                 WHERE u.user_id = ? AND u.isActive = 1`,
                [user_id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo User ID: ${error.message}`);
        }
    },

    // Lưu refresh token
    async saveRefreshToken(user_id, refreshToken) {
        if (!user_id || !refreshToken) throw new Error("User ID hoặc refresh token không được để trống");
        if (isNaN(user_id)) throw new Error("User ID phải là số hợp lệ");
        try {
            const [result] = await pool.execute(
                "UPDATE users SET refresh_token = ? WHERE user_id = ?",
                [refreshToken, user_id]
            );
            if (result.affectedRows === 0) {
                throw new Error("Không tìm thấy user để lưu refresh token");
            }
        } catch (error) {
            throw new Error(`Lỗi lưu refresh token: ${error.message}`);
        }
    },

    // Tìm user theo refresh token
    async findByRefreshToken(refreshToken) {
        if (!refreshToken) throw new Error("Refresh token không được để trống");
        try {
            console.log("Searching for user with refresh token:", refreshToken);
            const [rows] = await pool.execute(
                "SELECT user_id, username, full_name, email, password, role, refresh_token FROM users WHERE refresh_token = ? AND isActive = 1",
                [refreshToken]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo refresh token: ${error.message}`);
        }
    },

    // Xóa refresh token
    async clearRefreshToken(user_id) {
        if (!user_id || isNaN(user_id)) throw new Error("User ID phải là số hợp lệ");
        try {
            console.log("Clearing refresh token for user ID:", user_id);
            const [result] = await pool.execute(
                "UPDATE users SET refresh_token = NULL WHERE user_id = ?",
                [user_id]
            );
            if (result.affectedRows === 0) {
                throw new Error("Không tìm thấy user để xóa refresh token");
            }
        } catch (error) {
            throw new Error(`Lỗi xóa refresh token: ${error.message}`);
        }
    },

    // Lưu reset token (tận dụng cột refresh_token, thêm tiền tố để phân biệt)
    async saveResetToken(user_id, resetToken) {
        if (!user_id || !resetToken) throw new Error("User ID hoặc reset token không được để trống");
        if (isNaN(user_id)) throw new Error("User ID phải là số hợp lệ");
        try {
            const [result] = await pool.execute(
                "UPDATE users SET refresh_token = ? WHERE user_id = ?",
                [`reset:${resetToken}`, user_id] // Thêm tiền tố "reset:" để phân biệt
            );
            if (result.affectedRows === 0) {
                throw new Error("Không tìm thấy user để lưu reset token");
            }
        } catch (error) {
            throw new Error(`Lỗi lưu reset token: ${error.message}`);
        }
    },

    // Tìm user theo reset token
    async findByResetToken(resetToken) {
        if (!resetToken) throw new Error("Reset token không được để trống");
        try {
            const [rows] = await pool.execute(
                "SELECT user_id, username, full_name, email, password, role, refresh_token FROM users WHERE refresh_token = ? AND isActive = 1",
                [`reset:${resetToken}`]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Lỗi tìm kiếm theo reset token: ${error.message}`);
        }
    },

    // Cập nhật mật khẩu
    async updatePassword(user_id, password) {
        if (!user_id || !password) throw new Error("User ID hoặc password không được để trống");
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await pool.execute(
                "UPDATE users SET password = ?, refresh_token = NULL WHERE user_id = ?",
                [hashedPassword, user_id]
            );
            if (result.affectedRows === 0) {
                throw new Error("Không tìm thấy user để cập nhật mật khẩu");
            }
        } catch (error) {
            throw new Error(`Lỗi cập nhật mật khẩu: ${error.message}`);
        }
    }
};

module.exports = UserModel;