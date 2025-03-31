const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Đăng ký tài khoản
router.post("/register", authController.register);

// Đăng nhập
router.post("/login", authController.login);

// Làm mới access token
router.post("/refresh-token", authController.refreshToken);

// Đăng xuất (cần xác thực)
router.post("/logout", authMiddleware.authenticateToken, authController.logout);

// Đổi mật khẩu (cần xác thực)
router.post("/change-password", authMiddleware.authenticateToken, authController.changePassword);

// Kiểm tra trạng thái đăng nhập
//router.get("/status", authMiddleware.authenticateToken, authController.getUserStatus);

module.exports = router;
