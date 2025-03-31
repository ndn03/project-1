const productService = require("../services/product.service");

const homeController = {
    // Hàm định dạng giá sản phẩm
    formatPrice: (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    },

    // Hàm sinh sao đánh giá dựa trên rating
    generateStars: (rating) => {
        if (!rating) return '';
        let stars = '';
        const fullStars = Math.floor(rating); // Số sao đầy
        const hasHalfStar = rating % 1 >= 0.5; // Kiểm tra sao nửa

        // Thêm sao đầy vào chuỗi
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        // Thêm sao nửa nếu có
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        return stars; // Trả về chuỗi sao
    },

    // Trang chủ
    index: async (req, res) => {
        try {
            // Lấy danh sách sản phẩm theo từng danh mục
            const productsByCategory = await productService.getHomeProducts();

            res.render("index", { 
                productsByCategory, 
                formatPrice: homeController.formatPrice, 
                generateStars: homeController.generateStars 
            });
        } catch (error) {
            console.error("🔥 Lỗi khi hiển thị sản phẩm:", error);
            res.status(500).send("Lỗi server: " + error.message);
        }
    },

    // Trang chi tiết sản phẩm
    getProductDetail: async (req, res) => {
        const productId = req.params.id;

        try {
            // Lấy thông tin chi tiết sản phẩm từ service
            const productData = await productService.getProductDetail(productId);
            if (!productData) {
                return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
            }

            // Render trang chi tiết sản phẩm
            return res.render("productDetail", { 
                product: productData.product, 
                images: productData.images || [], // Thêm xử lý nếu không có hình ảnh
                details: productData.details || [], // Thêm xử lý nếu không có chi tiết sản phẩm
                reviews: productData.reviews || [], // Thêm xử lý nếu không có đánh giá
                image_url: productData.image_url, // Đảm bảo trả về đúng image_url
                formatPrice: homeController.formatPrice, 
                generateStars: homeController.generateStars 
            });

        } catch (error) {
            console.error("🔥 Lỗi khi lấy chi tiết sản phẩm:", error);
            res.status(500).json({ success: false, message: "Lỗi server" });
        }
    }
};

module.exports = homeController;
