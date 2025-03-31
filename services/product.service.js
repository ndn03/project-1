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
            const productDetail = await ProductModel.getProductDetailById(productId);
            if (!productDetail) {
                return null; // Return null if the product is not found
            }

            // Ensure all required fields are included
            return {
                product: {
                    ...productDetail,
                    stock_quantity: productDetail.stock_quantity || 0, // Ensure stock_quantity is included
                },
                images: productDetail.images || [],
                details: {
                    diameter: productDetail.diameter || "N/A",
                    water_resistance_level: productDetail.water_resistance_level || "N/A",
                    thickness: productDetail.thickness || "N/A",
                    material_face: productDetail.material_face || "N/A",
                    material_case: productDetail.material_case || "N/A",
                    material_strap: productDetail.material_strap || "N/A",
                    size: productDetail.size || "N/A",
                    movement: productDetail.movement || "N/A",
                    origin: productDetail.origin || "N/A",
                    warranty: productDetail.warranty || "N/A",
                },
                reviews: productDetail.reviews || [],
            };
        } catch (error) {
            throw new Error("Lỗi khi lấy chi tiết sản phẩm: " + error.message);
        }
    }
};

module.exports = ProductService;
