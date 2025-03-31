require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const authRouter = require("./routers/auth.router");
const productRouter = require("./routers/product.router");
const homeController = require("./controllers/home.controller"); // Import homeController
const homeRouter = require("./routers/home.router"); // Import homeRouter
const helmet = require("helmet"); // Import helmet for security
const app = express(); // Initialize the app using express()

// Bảo mật cơ bản
app.use(cors());
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
          "https://cdnjs.cloudflare.com", // ✅ Cho phép tải Font Awesome CSS
          "https://fonts.googleapis.com",
          "https://maxcdn.bootstrapcdn.com",
          "'unsafe-inline'" // ✅ Cho phép CSS nội tuyến
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com", // ✅ Cho phép tải Font Awesome fonts
          "https://fonts.gstatic.com",
          "data:" // ✅ Cho phép fonts nhúng
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://cdnjs.cloudflare.com" // ✅ Cho phép icon Font Awesome
        ],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  })
);

  
// Middleware parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Cấu hình static files
app.use(express.static(path.join(__dirname, "public"))); // Ensure static files are served
app.use("/img", express.static(path.join(__dirname, "public/img")));

// Render the index.ejs page for the root path
app.get("/", homeController.index);

// Sử dụng router
app.use("/", homeRouter); // Ensure homeRouter is registered here
app.use("/product", productRouter);
app.use("/", authRouter);

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API không tồn tại" });
});

// netstat -ano | findstr :8888
// taskkill /PID 13900 /F
// Khởi chạy server
const port = process.env.PORT || 3337;
app.listen(port, () => {
  console.log(`Server is running: http://localhost:${port}`);
});
