const authService = require("../services/auth.service");
const nodemailer = require("nodemailer");

const authController = {
    // Đăng ký tài khoản
    async register(req, res) {
        try {
            const { full_name, username, email, password, role = "customer" } = req.body;
            if (!full_name || !username || !email || !password) {
                return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
            }
            const newUser = await authService.register(full_name, username, email, password, role);
            res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Đăng nhập
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const { accessToken, refreshToken, user } = await authService.login(username, password);
    
            // Gửi refreshToken vào cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false, // Để true nếu dùng HTTPS
                path: "/",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
    
            // Gửi accessToken vào cookie (thay vì chỉ trả trong JSON)
            res.cookie("authToken", accessToken, {
                httpOnly: true,
                secure: false,
                path: "/",
                sameSite: "strict",
                maxAge: 10 * 60 * 60 * 1000, // 10 giờ
            });
    
            // Trả thông tin user trong JSON (không cần token nữa vì đã lưu vào cookie)
            res.json({
                username: user.username,
                role: user.role,
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    // Làm mới token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(400).json({ message: "Refresh token không được cung cấp" });
            }
    
            const { accessToken } = await authService.refreshToken(refreshToken);
            res.cookie("authToken", accessToken, {
                httpOnly: true,
                secure: false,
                path: "/",
                sameSite: "strict",
                maxAge: 10 * 60 * 60 * 1000, // 10 giờ
            });
            res.json({ accessToken });
        } catch (error) {
            res.status(403).json({ message: error.message });
        }
    },
    // Đổi mật khẩu
    async changePassword(req, res) {
        try {
            const userId = req.user.user_id; // Lấy từ middleware authenticateToken
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" });
            }
            const result = await authService.changePassword(userId, oldPassword, newPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Đăng xuất
    async logout(req, res) {
        try {
            const userId = req.user.user_id;
            await authService.logout(userId);
            res.clearCookie("refreshToken", {
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "strict",
            });
            res.clearCookie("authToken", {
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "strict",
            });
            res.status(200).json({ message: "Đăng xuất thành công" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server: " + error.message });
        }
    },
    // Kiểm tra trạng thái đăng nhập
    async getUserStatus(req, res) {
        try {
            const { username, role } = req.user;
            res.status(200).json({ username, role });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server: " + error.message });
        }
    },

    // Quên mật khẩu
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);
            res.json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);
            res.json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = authController;
