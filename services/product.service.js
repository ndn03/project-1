const ProductModel = require("../models/product.model");
const db = require('../config/db');

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
                reviews: productDetail.reviews.map(review => ({
                    review_id: review.review_id,
                    user_id: review.user_id,
                    product_id: review.product_id,
                    rating: review.rating,
                    comment: review.comment,
                    isActive: review.isActive,
                    created_at: review.created_at,
                    updated_at: review.updated_at,
                    updated_by: review.updated_by
                })) || [],
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
    },

    searchProducts: async ({ keyword, brand_id, category_id, sort }) => {
        let sql = `SELECT p.* FROM products p WHERE p.isActive = 1`;
        let params = [];

        if (keyword) {
            sql += ' AND p.name LIKE ?';
            params.push(`%${keyword}%`);
        }
        if (brand_id) {
            sql += ' AND p.brand_id = ?';
            params.push(brand_id);
        }
        if (category_id) {
            sql += ' AND p.product_id IN (SELECT product_id FROM product_categories WHERE category_id = ?)';
            params.push(category_id);
        }

        // Sắp xếp
        if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
        else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
        else if (sort === 'name_asc') sql += ' ORDER BY p.name ASC';
        else if (sort === 'name_desc') sql += ' ORDER BY p.name DESC';
        else sql += ' ORDER BY p.created_at DESC';

        const [rows] = await db.query(sql, params);
        return rows;
    },

    getCategoryNameById: async (categoryId) => {
        const [rows] = await db.query('SELECT name FROM categories WHERE category_id = ?', [categoryId]);
        return rows.length > 0 ? rows[0].name : '';
    },

    getBrandNameById: async (brandId) => {
        const [rows] = await db.query('SELECT name FROM brands WHERE brand_id = ?', [brandId]);
        return rows.length > 0 ? rows[0].name : '';
    }
};

module.exports = ProductService;