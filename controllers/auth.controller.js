const authService = require("../services/auth.service");

const authController = {
    // Đăng ký tài khoản
    async register(req, res) {
        try {
            const { full_name, username, email, password, role } = req.body;
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
            res.status(200).json({
                message: "Đăng nhập thành công!",
                accessToken,
                refreshToken,
                user
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    // Làm mới token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const newAccessToken = await authService.refreshToken(refreshToken);
            res.status(200).json(newAccessToken);
        } catch (error) {
            res.status(403).json({ message: error.message });
        }
    },

    // Đổi mật khẩu
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { oldPassword, newPassword } = req.body;
            const result = await authService.changePassword(userId, oldPassword, newPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Đăng xuất
    async logout(req, res) {
        try {
            const userId = req.user.id;
            await authService.logout(userId);
            res.status(200).json({ message: "Đăng xuất thành công!" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = authController;
