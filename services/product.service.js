const ProductModel = require("../models/product.model");

const ProductService = {
    // Lấy sản phẩm theo danh mục cho trang chủ
    getHomeProducts: async () => {
        try {
            const products = await ProductModel.getProductsByCategories();
            const productsByCategory = {};
            
            // Sắp xếp sản phẩm theo danh mục
            products.forEach(product => {
                if (!productsByCategory[product.category_name]) {
                    productsByCategory[product.category_name] = [];
                }
                productsByCategory[product.category_name].push(product);
            });

            return productsByCategory; // Trả về sản phẩm theo từng danh mục
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách sản phẩm: " + error.message);
        }
    },

    // Lấy chi tiết sản phẩm theo id
    getProductDetail: async (productId) => {
        try {
            // Gọi phương thức model mới để lấy chi tiết sản phẩm
            const productDetail = await ProductModel.getProductDetailById(productId);
            if (!productDetail || !productDetail.product) {
                return null; // Nếu không tìm thấy sản phẩm hoặc sản phẩm thiếu thông tin
            }

            // Kiểm tra sự tồn tại của các thuộc tính liên quan đến hình ảnh, chi tiết, đánh giá
            const productData = {
                product: productDetail.product,
                images: productDetail.images || [], // Mảng hình ảnh, mặc định là mảng rỗng nếu không có
                details: productDetail.details || [], // Chi tiết sản phẩm, mặc định là mảng rỗng nếu không có
                reviews: productDetail.reviews || [] // Đánh giá sản phẩm, mặc định là mảng rỗng nếu không có
            };
            return productData; // Trả về thông tin chi tiết sản phẩm
            
        } catch (error) {
            throw new Error("Lỗi khi lấy chi tiết sản phẩm: " + error.message);
        }
    }
};

module.exports = ProductService;
