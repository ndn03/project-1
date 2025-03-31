const jwt = require("jsonwebtoken");
const mysql = require("../config/db"); // Kết nối MySQL
require("dotenv").config();

const authMiddleware = {
    // Xác thực token
    authenticateToken: async (req, res, next) => {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Kiểm tra kết nối MySQL
            if (!mysql.pool) {
                console.log("Database chưa kết nối. Đang kết nối lại...");
                mysql.connectDB();
            }

            // Kiểm tra user trong database (isActive = 1)
            const [rows] = await mysql.pool.execute(
                "SELECT id, username, email, role FROM users WHERE id = ? AND isActive = 1",
                [decoded.id]
            );

            if (rows.length === 0) {
                return res.status(403).json({ message: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa" });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            console.error("Lỗi trong authenticateToken:", error);

            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
            }
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({ message: "Token không hợp lệ" });
            }

            return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
        }
    },

    // Phân quyền người dùng
    authorizeRoles: (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ message: "Bạn chưa đăng nhập" });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    message: "Bạn không có quyền truy cập",
                    required: roles,
                    current: req.user.role,
                });
            }
            next();
        };
    }
};

module.exports = authMiddleware;
