-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS watchshoppro;

USE watchshoppro;

-- Bảng lưu thông tin người dùng
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID người dùng (khóa chính)
    username VARCHAR(50) NOT NULL UNIQUE,  -- Tên đăng nhập (duy nhất)
    password VARCHAR(255) NOT NULL,  -- Mật khẩu đã mã hóa
    email VARCHAR(100) NOT NULL UNIQUE,  -- Email (duy nhất)
    full_name VARCHAR(100),  -- Họ và tên
    role ENUM('admin', 'customer') DEFAULT 'customer',  -- Phân quyền người dùng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo tài khoản
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Ngày cập nhật tài khoản
);

-- Bảng lưu thông tin thương hiệu sản phẩm
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID thương hiệu
    name VARCHAR(100) NOT NULL UNIQUE  -- Tên thương hiệu (duy nhất)
);

-- Bảng lưu danh mục sản phẩm
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID danh mục
    name VARCHAR(100) NOT NULL UNIQUE  -- Tên danh mục (duy nhất)
);

-- Bảng lưu thông tin sản phẩm
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID sản phẩm (khóa chính)
    name VARCHAR(255) NOT NULL,  -- Tên sản phẩm
    description TEXT,  -- Mô tả sản phẩm
    price DECIMAL(10, 2) NOT NULL,  -- Giá sản phẩm
    brand_id INT,  -- Liên kết với bảng brands
    image_url VARCHAR(255),  -- Ảnh chính của sản phẩm
    stock_quantity INT NOT NULL,  -- Số lượng tồn kho
    average_rating DECIMAL(3,2) DEFAULT 0,  -- Điểm đánh giá trung bình
    sold_quantity INT DEFAULT 0,  -- Số lượng bán
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày thêm sản phẩm
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Ngày cập nhật sản phẩm
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id)  -- Liên kết với bảng brands
);
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE `product_details` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `diameter` varchar(50) DEFAULT NULL,
  `water_resistance_level` enum('3ATM','5ATM','10ATM','20ATM') DEFAULT NULL,
  `thickness` varchar(50) DEFAULT NULL,
  `material_face` varchar(50) DEFAULT NULL,
  `material_case` varchar(50) DEFAULT NULL,
  `material_strap` varchar(50) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `movement` varchar(50) DEFAULT NULL,
  `origin` varchar(100) DEFAULT NULL,
  `warranty` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Bảng liên kết sản phẩm và danh mục (mối quan hệ nhiều-nhiều)
CREATE TABLE IF NOT EXISTS product_categories (
    product_category_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID liên kết
    product_id INT,  -- Liên kết với bảng products
    category_id INT,  -- Liên kết với bảng categories
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,  -- Liên kết với bảng products
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE  -- Liên kết với bảng categories
);

-- Bảng lưu thông tin đánh giá của khách hàng
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID đánh giá (khóa chính)
    user_id INT,  -- Người đánh giá
    product_id INT,  -- Sản phẩm được đánh giá
    rating INT CHECK (rating >= 1 AND rating <= 5),  -- Điểm đánh giá (1-5 sao)
    comment TEXT,  -- Bình luận của khách hàng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày đánh giá
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Ngày cập nhật đánh giá
    FOREIGN KEY (user_id) REFERENCES users(user_id),  -- Liên kết với bảng users
    FOREIGN KEY (product_id) REFERENCES products(product_id)  -- Liên kết với bảng products
);

-- Bảng lưu thông tin khuyến mãi (voucher)
CREATE TABLE IF NOT EXISTS promotions (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID khuyến mãi
    code VARCHAR(50) NOT NULL UNIQUE,  -- Mã khuyến mãi (duy nhất)
    discount DECIMAL(5, 2) NOT NULL,  -- Giá trị giảm giá
    valid_from DATE,  -- Ngày bắt đầu áp dụng
    valid_to DATE,  -- Ngày hết hạn
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo mã giảm giá
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Ngày cập nhật mã giảm giá
);

-- Bảng lưu thông tin mã giảm giá (Voucher)
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID mã giảm giá
    code VARCHAR(50) NOT NULL UNIQUE,  -- Mã giảm giá (duy nhất)
    discount DECIMAL(5, 2) NOT NULL,  -- Giá trị giảm (phần trăm hoặc số tiền)
    discount_type ENUM('percentage', 'fixed') NOT NULL,  -- Loại giảm giá (% hoặc số tiền cố định)
    valid_from DATE,  -- Ngày bắt đầu hiệu lực
    valid_to DATE,  -- Ngày hết hạn
    min_order_value DECIMAL(10, 2) DEFAULT 0,  -- Giá trị đơn hàng tối thiểu để áp dụng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo mã giảm giá
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Ngày cập nhật mã giảm giá
);

-- Bảng lưu thông tin phương thức thanh toán
CREATE TABLE IF NOT EXISTS payment_methods (
    method_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID phương thức thanh toán (khóa chính)
    name VARCHAR(50) NOT NULL UNIQUE  -- Tên phương thức thanh toán (duy nhất)
);

-- Bảng lưu trạng thái đơn hàng
CREATE TABLE IF NOT EXISTS order_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID trạng thái đơn hàng (khóa chính)
    name VARCHAR(50) NOT NULL UNIQUE  -- Tên trạng thái đơn hàng (duy nhất)
);

-- Bảng lưu thông tin đơn hàng
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID đơn hàng (khóa chính)
    user_id INT,  -- Liên kết với người mua hàng
    total_amount DECIMAL(10, 2) NOT NULL,  -- Tổng tiền đơn hàng
    status_id INT,  -- Liên kết với bảng order_status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo đơn hàng
    FOREIGN KEY (user_id) REFERENCES users(user_id),  -- Liên kết với bảng users
    FOREIGN KEY (status_id) REFERENCES order_status(status_id)  -- Liên kết với bảng order_status
);

-- Bảng lưu thông tin thanh toán
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID thanh toán
    order_id INT,  -- Liên kết với đơn hàng
    method_id INT,  -- Liên kết với bảng payment_methods
    amount DECIMAL(10, 2) NOT NULL,  -- Số tiền thanh toán
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',  -- Trạng thái thanh toán
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo giao dịch
    FOREIGN KEY (order_id) REFERENCES orders(order_id),  -- Liên kết với bảng orders
    FOREIGN KEY (method_id) REFERENCES payment_methods(method_id)  -- Liên kết với bảng payment_methods
);

-- Bảng lưu thông tin giỏ hàng
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID giỏ hàng
    user_id INT,  -- Liên kết với bảng users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo giỏ hàng
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE  -- Xóa user thì xóa giỏ hàng
);

-- Bảng lưu chi tiết giỏ hàng
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID chi tiết giỏ hàng
    cart_id INT,  -- Liên kết với giỏ hàng
    product_id INT,  -- Sản phẩm trong giỏ hàng
    quantity INT NOT NULL,  -- Số lượng sản phẩm
    price DECIMAL(10,2) NOT NULL,  -- Giá sản phẩm tại thời điểm thêm vào giỏ hàng
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,  -- Xóa giỏ hàng thì xóa sản phẩm trong giỏ
    FOREIGN KEY (product_id) REFERENCES products(product_id)  -- Liên kết sản phẩm
);

-- Dữ liệu mẫu cho bảng order_status
INSERT INTO order_status (name) VALUES
('Chờ xác nhận'),
('Đã xác nhận'),
('Chờ giao hàng'),
('Đã giao hàng'),
('Hủy');

-- Dữ liệu mẫu cho bảng payment_methods
INSERT INTO payment_methods (name) VALUES
('Thanh toán khi nhận hàng'),
('Thanh toán bằng ngân hàng'),
('Thanh toán qua Pay-pal');

-- Dữ liệu mẫu cho bảng categories
INSERT INTO categories (name) VALUES 
('Đồng Hồ Nam'),
('Đồng Hồ Nữ'),
('Đồng hồ VIP');
-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS watchshoppro;

USE watchshoppro;

-- Bảng lưu thông tin người dùng
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID người dùng (khóa chính)
    username VARCHAR(50) NOT NULL UNIQUE,  -- Tên đăng nhập (duy nhất)
    password VARCHAR(255) NOT NULL,  -- Mật khẩu đã mã hóa
    email VARCHAR(100) NOT NULL UNIQUE,  -- Email (duy nhất)
    full_name VARCHAR(100),  -- Họ và tên
    role ENUM('admin', 'customer') DEFAULT 'customer',  -- Phân quyền người dùng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo tài khoản
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Ngày cập nhật tài khoản
);

-- Bảng lưu thông tin thương hiệu sản phẩm
CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID thương hiệu
    name VARCHAR(100) NOT NULL UNIQUE  -- Tên thương hiệu (duy nhất)
);

-- Bảng lưu danh mục sản phẩm
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID danh mục
    name VARCHAR(100) NOT NULL UNIQUE  -- Tên danh mục (duy nhất)
);

-- Bảng lưu thông tin sản phẩm
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID sản phẩm (khóa chính)
    name VARCHAR(255) NOT NULL,  -- Tên sản phẩm
    description TEXT,  -- Mô tả sản phẩm
    price DECIMAL(10, 2) NOT NULL,  -- Giá sản phẩm
    brand_id INT,  -- Liên kết với bảng brands
    image_url VARCHAR(255),  -- Ảnh chính của sản phẩm
    stock_quantity INT NOT NULL,  -- Số lượng tồn kho
    average_rating DECIMAL(3,2) DEFAULT 0,  -- Điểm đánh giá trung bình
    sold_quantity INT DEFAULT 0,  -- Số lượng bán
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày thêm sản phẩm
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Ngày cập nhật sản phẩm
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id)  -- Liên kết với bảng brands
);

-- Bảng liên kết sản phẩm và danh mục (mối quan hệ nhiều-nhiều)
CREATE TABLE IF NOT EXISTS product_categories (
    product_category_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID liên kết
    product_id INT,  -- Liên kết với bảng products
    category_id INT,  -- Liên kết với bảng categories
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,  -- Liên kết với bảng products
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE  -- Liên kết với bảng categories
);

-- Bảng lưu thông tin đánh giá của khách hàng
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID đánh giá (khóa chính)
    user_id INT,  -- Người đánh giá
    product_id INT,  -- Sản phẩm được đánh giá
    rating INT CHECK (rating >= 1 AND rating <= 5),  -- Điểm đánh giá (1-5 sao)
    comment TEXT,  -- Bình luận của khách hàng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày đánh giá
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Ngày cập nhật đánh giá
    FOREIGN KEY (user_id) REFERENCES users(user_id),  -- Liên kết với bảng users
    FOREIGN KEY (product_id) REFERENCES products(product_id)  -- Liên kết với bảng products
);

-- Bảng lưu thông tin khuyến mãi (voucher)
CREATE TABLE IF NOT EXISTS promotions (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID khuyến mãi
    code VARCHAR(50) NOT NULL UNIQUE,  -- Mã khuyến mãi (duy nhất)
    discount DECIMAL(5, 2) NOT NULL,  -- Giá trị giảm giá
    valid_from DATE,  -- Ngày bắt đầu áp dụng
    valid_to DATE,  -- Ngày hết hạn
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo mã giảm giá
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Ngày cập nhật mã giảm giá
);

-- Bảng lưu thông tin mã giảm giá (Voucher)
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID mã giảm giá
    code VARCHAR(50) NOT NULL UNIQUE,  -- Mã giảm giá (duy nhất)
    discount DECIMAL(5, 2) NOT NULL,  -- Giá trị giảm (phần trăm hoặc số tiền)
    discount_type ENUM('percentage', 'fixed') NOT NULL,  -- Loại giảm giá (% hoặc số tiền cố định)
    valid_from DATE,  -- Ngày bắt đầu hiệu lực
    valid_to DATE,  -- Ngày hết hạn
    min_order_value DECIMAL(10, 2) DEFAULT 0,  -- Giá trị đơn hàng tối thiểu để áp dụng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo mã giảm giá
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Ngày cập nhật mã giảm giá
);

-- Bảng lưu thông tin phương thức thanh toán
CREATE TABLE IF NOT EXISTS payment_methods (
    method_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID phương thức thanh toán (khóa chính)
    name VARCHAR(50) NOT NULL UNIQUE  -- Tên phương thức thanh toán (duy nhất)
);

-- Bảng lưu trạng thái đơn hàng
CREATE TABLE IF NOT EXISTS order_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID trạng thái đơn hàng (khóa chính)
    name VARCHAR(50) NOT NULL UNIQUE  -- Tên trạng thái đơn hàng (duy nhất)
);

-- Bảng lưu thông tin đơn hàng
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID đơn hàng (khóa chính)
    user_id INT,  -- Liên kết với người mua hàng
    total_amount DECIMAL(10, 2) NOT NULL,  -- Tổng tiền đơn hàng
    status_id INT,  -- Liên kết với bảng order_status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo đơn hàng
    FOREIGN KEY (user_id) REFERENCES users(user_id),  -- Liên kết với bảng users
    FOREIGN KEY (status_id) REFERENCES order_status(status_id)  -- Liên kết với bảng order_status
);

-- Bảng lưu thông tin thanh toán
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID thanh toán
    order_id INT,  -- Liên kết với đơn hàng
    method_id INT,  -- Liên kết với bảng payment_methods
    amount DECIMAL(10, 2) NOT NULL,  -- Số tiền thanh toán
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',  -- Trạng thái thanh toán
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo giao dịch
    FOREIGN KEY (order_id) REFERENCES orders(order_id),  -- Liên kết với bảng orders
    FOREIGN KEY (method_id) REFERENCES payment_methods(method_id)  -- Liên kết với bảng payment_methods
);

-- Bảng lưu thông tin giỏ hàng
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID giỏ hàng
    user_id INT,  -- Liên kết với bảng users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày tạo giỏ hàng
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE  -- Xóa user thì xóa giỏ hàng
);

-- Bảng lưu chi tiết giỏ hàng
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,  -- ID chi tiết giỏ hàng
    cart_id INT,  -- Liên kết với giỏ hàng
    product_id INT,  -- Sản phẩm trong giỏ hàng
    quantity INT NOT NULL,  -- Số lượng sản phẩm
    price DECIMAL(10,2) NOT NULL,  -- Giá sản phẩm tại thời điểm thêm vào giỏ hàng
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,  -- Xóa giỏ hàng thì xóa sản phẩm trong giỏ
    FOREIGN KEY (product_id) REFERENCES products(product_id)  -- Liên kết sản phẩm
);

-- Dữ liệu mẫu cho bảng order_status
INSERT INTO order_status (name) VALUES
('Chờ xác nhận'),
('Đã xác nhận'),
('Chờ giao hàng'),
('Đã giao hàng'),
('Hủy');

-- Dữ liệu mẫu cho bảng payment_methods
INSERT INTO payment_methods (name) VALUES
('Thanh toán khi nhận hàng'),
('Thanh toán bằng ngân hàng'),
('Thanh toán qua Pay-pal');

-- Dữ liệu mẫu cho bảng categories
INSERT INTO categories (name) VALUES 
('Đồng Hồ Nam'),
('Đồng Hồ Nữ'),
('Đồng hồ VIP');
