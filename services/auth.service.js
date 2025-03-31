const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const authService = {
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
                throw new Error("Tên đăng nhập hoặc email đã tồn tại!");
            }

            // Hash mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo user mới
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
            console.error("Lỗi trong register:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Đăng nhập
    async login(username, password) {
        try {
            const [users] = await pool.execute(
                "SELECT * FROM users WHERE username = ? AND isActive = 1",
                [username]
            );

            if (users.length === 0) {
                throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!");
            }

            const user = users[0];

            // Kiểm tra mật khẩu
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new Error("Mật khẩu không chính xác!");
            }

            // Tạo access token và refresh token
            const accessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: "7d" }
            );

            // Lưu refresh token vào database
            await pool.execute(
                "UPDATE users SET refresh_token = ? WHERE id = ?",
                [refreshToken, user.id]
            );

            return { accessToken, refreshToken, user };
        } catch (error) {
            console.error("Lỗi trong login:", error);
            throw error;
        }
    },

    // Làm mới token
    async refreshToken(refreshToken) {
        try {
            if (!refreshToken) {
                throw new Error("Không tìm thấy refresh token!");
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const [users] = await pool.execute(
                "SELECT * FROM users WHERE id = ? AND isActive = 1",
                [decoded.id]
            );

            if (users.length === 0 || users[0].refresh_token !== refreshToken) {
                throw new Error("Refresh token không hợp lệ hoặc đã hết hạn!");
            }

            // Tạo access token mới
            const newAccessToken = jwt.sign(
                { id: users[0].id, role: users[0].role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return { accessToken: newAccessToken };
        } catch (error) {
            console.error("Lỗi trong refreshToken:", error);
            throw error;
        }
    },

    // Đổi mật khẩu
    async changePassword(userId, oldPassword, newPassword) {
        try {
            const [users] = await pool.execute(
                "SELECT * FROM users WHERE id = ? AND isActive = 1",
                [userId]
            );

            if (users.length === 0) {
                throw new Error("Người dùng không tồn tại hoặc bị vô hiệu hóa!");
            }

            const user = users[0];

            // Kiểm tra mật khẩu cũ
            const validPassword = await bcrypt.compare(oldPassword, user.password);
            if (!validPassword) {
                throw new Error("Mật khẩu cũ không chính xác!");
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
                hashedPassword,
                userId
            ]);

            return { message: "Mật khẩu đã được thay đổi thành công!" };
        } catch (error) {
            console.error("Lỗi trong changePassword:", error);
            throw error;
        }
    },

    // Đăng xuất (xóa refresh token)
    async logout(userId) {
        try {
            await pool.execute("UPDATE users SET refresh_token = NULL WHERE id = ?", [
                userId
            ]);

            return { message: "Đăng xuất thành công!" };
        } catch (error) {
            console.error("Lỗi trong logout:", error);
            throw error;
        }
    }
};

module.exports = authService;
