const db = require('../config/db');

const CategoryService = {
    getAllCategories: async () => {
        try {
            const [categories] = await db.query('SELECT category_id, name FROM categories');
            return categories;
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách danh mục: " + error.message);
        }
    },

    createCategory: async (categoryData) => {
        try {
            const { name } = categoryData;
            const [result] = await db.query(
                'INSERT INTO categories (name) VALUES (?)',
                [name]
            );
            return { category_id: result.insertId, name };
        } catch (error) {
            throw new Error("Lỗi khi tạo danh mục: " + error.message);
        }
    },

    updateCategory: async (categoryId, categoryData) => {
        try {
            const { name } = categoryData;
            const [result] = await db.query(
                'UPDATE categories SET name = ? WHERE category_id = ?',
                [name, categoryId]
            );
            if (result.affectedRows === 0) {
                throw new Error("Danh mục không tồn tại");
            }
            return { category_id: categoryId, name };
        } catch (error) {
            throw new Error("Lỗi khi cập nhật danh mục: " + error.message);
        }
    },

    deleteCategory: async (categoryId) => {
        try {
            // Kiểm tra xem danh mục có đang được sử dụng trong bảng product_categories không
            const [products] = await db.query(
                'SELECT COUNT(*) as count FROM product_categories WHERE category_id = ?',
                [categoryId]
            );
            
            if (products[0].count > 0) {
                throw new Error("Không thể xóa danh mục này vì đang có sản phẩm sử dụng");
            }

            const [result] = await db.query(
                'DELETE FROM categories WHERE category_id = ?',
                [categoryId]
            );
            if (result.affectedRows === 0) {
                throw new Error("Danh mục không tồn tại");
            }
            return true;
        } catch (error) {
            throw new Error("Lỗi khi xóa danh mục: " + error.message);
        }
    }
};

module.exports = CategoryService; 