require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch'); // Cần cài đặt: npm install node-fetch
const orderRoutes = require('./routers/order.router');
const authRouter = require("./routers/auth.router");
const productRouter = require("./routers/product.router");
const homeController = require("./controllers/home.controller");
const homeRouter = require("./routers/home.router");
const cartRouter = require("./routers/cart.router");
const adminRouter = require("./routers/admin.router");
const nodemailer = require('nodemailer');
const authMiddleware = require("./middleware/auth.middleware");
const overviewController = require('./controllers/overview.controller');

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/img", express.static(path.join(__dirname, "public/img")));

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
        scriptSrcAttr: ["'unsafe-inline'"],
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
        connectSrc: [
          "'self'", // Cho phép tất cả các route trên domain server (bao gồm /proxy/provinces)
          "https://provinces.open-api.vn" // Giữ để hỗ trợ kết nối trực tiếp nếu cần
        ],
        frameSrc: ["'none'"]
      }
    }
  })
);

// Proxy routes để gọi API tỉnh thành
app.get('/proxy/provinces', async (req, res) => {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/p/');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Lỗi proxy provinces:", error);
    res.status(500).json({ error: "Không thể tải danh sách tỉnh/thành phố" });
  }
});

app.get('/proxy/districts/:provinceId', async (req, res) => {
  try {
    const provinceId = req.params.provinceId;
    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`);
    const data = await response.json();
    res.json(data.districts || []);
  } catch (error) {
    console.error("Lỗi proxy districts:", error);
    res.status(500).json({ error: "Không thể tải danh sách quận/huyện" });
  }
});

app.get('/proxy/wards/:districtId', async (req, res) => {
  try {
    const districtId = req.params.districtId;
    const response = await fetch(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`);
    const data = await response.json();
    res.json(data.wards || []);
  } catch (error) {
    console.error("Lỗi proxy wards:", error);
    res.status(500).json({ error: "Không thể tải danh sách phường/xã" });
  }
});

app.get("/", homeController.index);
app.use("/", homeRouter);
app.use("/product", productRouter);
app.use("/", authRouter);
app.use("/cart", cartRouter);
app.use('/admin', adminRouter);
app.use('/', orderRoutes);

// Overview route
app.get('/admin/api/overview', authMiddleware.authenticateToken, overviewController.getOverview);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API không tồn tại" });
});
// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Lỗi cấu hình email:', error);
  } else {
    console.log('Email server sẵn sàng:', success);
  }
});

module.exports.transporter = transporter;
const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});