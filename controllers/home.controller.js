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
                generateStars: homeController.generateStars,
                keyword: '',
                brandName: '',
                categoryName: '',
                sortLabel: ''
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
            const productData = await productService.getProductDetail(productId);
            if (!productData) {
                return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
            }

            // Ensure all required data is passed to the view
            return res.render("productDetail", { 
                product: productData.product, 
                images: productData.images || [], 
                details: productData.details || {}, 
                reviews: productData.reviews || [], 
                formatPrice: homeController.formatPrice, 
                generateStars: homeController.generateStars 
            });

        } catch (error) {
            console.error("🔥 Lỗi khi lấy chi tiết sản phẩm:", error);
            res.status(500).json({ success: false, message: "Lỗi server" });
        }
    },

    search: async (req, res) => {
        const { keyword, brand_id, category_id, sort } = req.query;
        const products = await productService.searchProducts({ keyword, brand_id, category_id, sort });
        let categoryName = '';
        let brandName = '';
        let sortLabel = '';

        if (category_id) {
            categoryName = await productService.getCategoryNameById(category_id);
        }
        if (brand_id) {
            brandName = await productService.getBrandNameById(brand_id);
        }
        // Gán nhãn sắp xếp
        switch (sort) {
            case 'price_asc': sortLabel = 'Giá tăng dần'; break;
            case 'price_desc': sortLabel = 'Giá giảm dần'; break;
            case 'name_asc': sortLabel = 'Tên A-Z'; break;
            case 'name_desc': sortLabel = 'Tên Z-A'; break;
            case 'newest': sortLabel = 'Mới nhất'; break;
        }

        res.render('index', {
            searchResults: products,
            keyword,
            categoryName,
            brandName,
            sortLabel,
            formatPrice: homeController.formatPrice,
            generateStars: homeController.generateStars
        });
    },

    // Trang tài khoản
    accountPage: (req, res) => {
        res.render("account");
    }
};

module.exports = homeController;
