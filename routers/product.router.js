const express = require("express");
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Lấy danh sách sản phẩm
router.get("/", productController.getAllProducts);

// Lấy chi tiết sản phẩm theo ID
router.get("/:id", productController.getProductById);

// Thêm sản phẩm (Admin)
router.post("/", authMiddleware.authenticateToken, authMiddleware.authorizeRoles("admin"), productController.createProduct);

// Cập nhật sản phẩm (Admin)
router.put("/:id", authMiddleware.authenticateToken, authMiddleware.authorizeRoles("admin"), productController.updateProduct);

// Xóa sản phẩm (Admin)
router.delete("/:id", authMiddleware.authenticateToken, authMiddleware.authorizeRoles("admin"), productController.deleteProduct);

module.exports = router;