const express = require("express");
const productController = require("../controllers/product.controller");

const router = express.Router();

// Lấy danh sách sản phẩm
router.get("/", productController.getAllProducts);

// Thêm sản phẩm (Admin)
router.post("/", productController.createProduct);

// Cập nhật sản phẩm (Admin)
router.put("/:id", productController.updateProduct);

// Xóa sản phẩm (Admin)
router.delete("/:id", productController.deleteProduct);

module.exports = router;
