const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/auth.model");
require("dotenv").config();

const authService = {
    // Đăng ký người dùng mới
    async register(full_name, username, email, password, role = "customer") {
        if (!full_name || !username || !email || !password) {
            throw new Error("Vui lòng điền đầy đủ thông tin");
        }
        if (!["admin", "customer"].includes(role)) {
            throw new Error("Vai trò không hợp lệ");
        }

        try {
            const newUser = await UserModel.register(full_name, username, email, password, role);
            return newUser;
        } catch (error) {
            throw error;
        }
    },

    // Đăng nhập
    async login(username, password) {
        if (!username || !password) {
            throw new Error("Vui lòng nhập tên đăng nhập và mật khẩu");
        }

        const user = await UserModel.findByUsername(username);
        if (!user) {
            throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!");
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error("Mật khẩu không chính xác!");
        }

        const accessToken = jwt.sign(
            { user_id: user.user_id, role: user.role }, // Sửa: dùng "user_id"
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );
        const refreshToken = jwt.sign(
            { user_id: user.user_id }, // Sửa: dùng "user_id" (tùy chọn, vì refresh token không cần role)
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );


        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        //console.log('JWT_SECRET used:', process.env.JWT_SECRET);
        //console.log('JWT_REFRESH_SECRET used:', process.env.JWT_REFRESH_SECRET);
        
        await UserModel.saveRefreshToken(user.user_id, refreshToken);
        return { accessToken, refreshToken, user };
    },

    // Làm mới token
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new Error("Không tìm thấy refresh token!");
        }

        const user = await UserModel.findByRefreshToken(refreshToken);
        if (!user) {
            throw new Error("Refresh token không hợp lệ hoặc đã hết hạn!");
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (decoded.user_id !== user.user_id) { // Sửa: kiểm tra "user_id" thay vì "id"
            throw new Error("Refresh token không khớp với user!");
        }

        const newAccessToken = jwt.sign(
            { user_id: user.user_id, role: user.role }, // Sửa: dùng "user_id"
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );

        return { accessToken: newAccessToken };
    },

    // Đổi mật khẩu
    async changePassword(userId, oldPassword, newPassword) {
        if (!userId || !oldPassword || !newPassword) {
            throw new Error("Vui lòng nhập đầy đủ thông tin");
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("Người dùng không tồn tại hoặc bị vô hiệu hóa!");
        }

        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            throw new Error("Mật khẩu cũ không chính xác!");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserModel.pool.execute("UPDATE users SET password = ? WHERE user_id = ?", [
            hashedPassword,
            userId,
        ]);

        return { message: "Mật khẩu đã được thay đổi thành công!" };
    },

    // Đăng xuất
    async logout(userId) {
        if (!userId) {
            throw new Error("User ID không được để trống");
        }

        await UserModel.clearRefreshToken(userId);
        return { message: "Đăng xuất thành công!" };
    },
};

module.exports = authService;