const authService = require("../services/auth.service");

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
            res.json({
                username: user.username,
                role: user.role,
                accessToken,
                refreshToken,
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    // Làm mới token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return Medres.status(400).json({ message: "Refresh token không được cung cấp" });
            }
            const { accessToken } = await authService.refreshToken(refreshToken);
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
            const userId = req.user.user_id; // Lấy từ middleware authenticateToken
            const result = await authService.logout(userId);
            res.status(200).json(result);
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
};

module.exports = authController;