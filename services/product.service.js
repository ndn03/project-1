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
    },

    // Lấy danh sách sản phẩm với bộ lọc và phân trang
    getAllProducts: async ({ limit = 10, offset = 0, brandId, categoryId, minPrice, maxPrice, sortBy }) => {
        try {
            const products = await ProductModel.getProductsByFilters({
                limit,
                offset,
                brandId,
                categoryId,
                minPrice,
                maxPrice,
                sortBy
            });
            return products;
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách sản phẩm: " + error.message);
        }
    },

    // Thêm sản phẩm mới
    createProduct: async (data) => {
        try {
            const { product, details, images, categories } = data;
            if (!product?.name || !product?.price || !product?.brand_id) {
                throw new Error("Thiếu thông tin bắt buộc: name, price, hoặc brand_id");
            }
            const productId = await ProductModel.createProduct(product, details || {}, images || [], categories || []);
            return { productId };
        } catch (error) {
            throw new Error("Lỗi khi tạo sản phẩm: " + error.message);
        }
    },

    // Cập nhật sản phẩm
    updateProduct: async (productId, data) => {
        try {
            const { product, details, images, categories } = data;
            if (!product?.name || !product?.price || !product?.brand_id) {
                throw new Error("Thiếu thông tin bắt buộc: name, price, hoặc brand_id");
            }
            const success = await ProductModel.updateProduct(productId, product, details || {}, images || [], categories || []);
            if (!success) {
                throw new Error("Sản phẩm không tồn tại");
            }
            return { productId };
        } catch (error) {
            throw new Error("Lỗi khi cập nhật sản phẩm: " + error.message);
        }
    },

    // Xóa sản phẩm
    deleteProduct: async (productId) => {
        try {
            const success = await ProductModel.deleteProduct(productId);
            if (!success) {
                throw new Error("Sản phẩm không tồn tại");
            }
            return true;
        } catch (error) {
            throw new Error("Lỗi khi xóa sản phẩm: " + error.message);
        }
    }
};

module.exports = ProductService;