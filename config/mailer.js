const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email gửi đi
        pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng (App password)
    }
});

module.exports = transporter;
