const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const authMiddleware = {
    authenticateToken: async (req, res, next) => {
        // 🆕 Lấy token từ Cookie
        const token = req.cookies.authToken; // 👈 Bổ sung dòng này
        console.log(`[${req.method} ${req.path}] Cookie hiện tại:`, req.cookies); // Log toàn bộ cookie
        console.log(`[${req.method} ${req.path}] Received Cookie Token:`, token);
        console.log(`[${req.method} ${req.path}] Received Cookie Token:`, token);

        if (!token) {
            console.log(`[${req.method} ${req.path}] Cookie Token missing`);
            return res.status(401).json({ message: "Cookie Token không hợp lệ hoặc thiếu" });
        }

        try {
            const secretKey = process.env.JWT_SECRET;
            if (!secretKey) {
                console.error("LỖI: JWT_SECRET chưa được cấu hình!");
                return res.status(500).json({ message: "Lỗi máy chủ - Thiếu JWT_SECRET" });
            }

            const decoded = jwt.verify(token, secretKey);
            if (process.env.NODE_ENV === 'development') {
                console.log("Decoded JWT:", decoded);
            }

            if (!decoded.user_id) {
                if (process.env.NODE_ENV === 'development') {
                    console.log("Token Payload Error: Thiếu user_id trong payload");
                }
                return res.status(401).json({ message: "Token không chứa user_id" });
            }

            try {
                const [rows] = await db.execute(
                    "SELECT user_id, username, email, role FROM users WHERE user_id = ? AND isActive = 1",
                    [decoded.user_id]
                );

                if (rows.length === 0) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log("Database Error: Không tìm thấy user hoặc user không active");
                    }
                    return res.status(403).json({ message: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa" });
                }

                req.user = rows[0];
                next();
            } catch (dbError) {
                console.error("Database Error:", dbError.message);
                return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dbError.message });
            }
        } catch (error) {
            console.error("Lỗi trong authenticateToken:", error);

            if (error.name === "TokenExpiredError") {
                if (process.env.NODE_ENV === 'development') {
                    console.log("Token Error: Token đã hết hạn");
                }
                return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
            }
            if (error.name === "JsonWebTokenError") {
                if (process.env.NODE_ENV === 'development') {
                    console.log("Token Error: Token không hợp lệ hoặc định dạng sai");
                }
                return res.status(401).json({ message: "Token không hợp lệ" });
            }

            return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
        }
    },

    authorizeRoles: (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                if (process.env.NODE_ENV === 'development') {
                    console.log("Authorize Error: Chưa đăng nhập");
                }
                return res.status(401).json({ message: "Bạn chưa đăng nhập" });
            }

            if (!roles.includes(req.user.role)) {
                if (process.env.NODE_ENV === 'development') {
                    console.log("Authorize Error: Không có quyền truy cập", {
                        required: roles,
                        current: req.user.role,
                    });
                }
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
