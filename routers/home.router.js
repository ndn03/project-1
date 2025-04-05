const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home.controller"); // Đảm bảo đã import homeController

// Route cho trang chủ
router.get("/", homeController.index); // Nếu `getHomePage` là `index`

// Route chi tiết sản phẩm
router.get("/product/detail/:id", homeController.getProductDetail); // Sử dụng homeController để gọi getProductDetail

// router.get("/cart", (req, res) => {
//     res.render("cart");
// }); // Render trang giỏ hàng
module.exports = router;
