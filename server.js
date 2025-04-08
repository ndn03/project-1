require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require('cookie-parser');

// Import routers và controller
const authRouter = require("./routers/auth.router");
const productRouter = require("./routers/product.router");
const homeController = require("./controllers/home.controller");
const homeRouter = require("./routers/home.router");
const cartRouter = require("./routers/cart.router");

// Import middleware
const authMiddleware = require("./middleware/auth.middleware");

// Khởi tạo app Express
const app = express();

// Cấu hình middleware
app.use(cookieParser()); // Sử dụng cookie-parser để đọc cookies
app.use(cors()); // Bảo mật CORS
app.use(helmet()); // Bảo mật với Helmet
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Cấu hình EJS và static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // Đảm bảo static files được phục vụ
app.use("/img", express.static(path.join(__dirname, "public/img"))); // Phục vụ hình ảnh từ thư mục /img

// Cấu hình bảo mật cơ bản với Helmet (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://ajax.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://maxcdn.bootstrapcdn.com",
          "'unsafe-inline'"
        ],
        scriptSrcAttr: ["'unsafe-inline'"], // Cho phép inline event handlers
        styleSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com", 
          "https://fonts.googleapis.com",
          "https://maxcdn.bootstrapcdn.com",
          "'unsafe-inline'"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com", 
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://cdnjs.cloudflare.com"
        ],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  })
);

// Định tuyến
app.get("/", homeController.index); // Render trang chủ
app.use("/", homeRouter); // Đảm bảo homeRouter được sử dụng ở đây
app.use("/product", productRouter); // Các route cho sản phẩm
app.use("/", authRouter); // Đảm bảo authRouter được sử dụng ở đây
app.use("/cart", cartRouter); // Giỏ hàng

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API không tồn tại" });
});

// Khởi chạy server
const port = process.env.PORT || 3337;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
