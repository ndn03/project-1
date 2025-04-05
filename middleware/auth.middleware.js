// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const authMiddleware = {
    // Xác thực token
    authenticateToken: async (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({alert: "Alert: Header Authorization không hợp lệ hoặc thiếu" });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ alert: "Alert: Token không được cung cấp sau 'Bearer'" });
        }

        try {
            const secretKey = process.env.JWT_SECRET;
            if (!secretKey) {
                console.error("LỖI: JWT_SECRET chưa được cấu hình!");
                return res.status(500).json({alert: "Alert: Lỗi máy chủ - Thiếu JWT_SECRET" });
            }

            const decoded = jwt.verify(token, secretKey);
            console.log("Decoded JWT:", decoded); // Debug payload

            // Kiểm tra user trong database
            const [rows] = await db.execute(
                "SELECT user_id, username, email, role FROM users WHERE user_id = ? AND isActive = 1",
                [decoded.id]
            );

            if (rows.length === 0) {
                return res.status(403).json({alert: "Alert: Tài khoản không tồn tại hoặc đã bị vô hiệu hóa" });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            console.error("Lỗi trong authenticateToken:", error);

            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ alert: "Alert: Phiên đăng nhập đã hết hạn" });
            }
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({ alert: "Alert: Token không hợp lệ" });
            }

            return res.status(500).json({ alert: "Alert: Lỗi máy chủ", error: error.message });
        }
    },

    // Phân quyền người dùng
    authorizeRoles: (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ alert: "Alert: Bạn chưa đăng nhập" });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    message: "Alert: Bạn không có quyền truy cập",
                    required: roles,
                    current: req.user.role,
                });
            }
            next();
        };
    }
};

module.exports = authMiddleware;