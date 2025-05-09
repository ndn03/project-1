require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0    
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Lỗi kết nối đến database:', err.message);
        console.error('Cấu hình:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            database: process.env.DB_NAME
        });
        return;
    }
    console.log('Kết nối đến database thành công!');
    connection.release();
});

module.exports = pool.promise();