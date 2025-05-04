const db = require('../config/db');

const BrandService = {
    getAllBrands: async () => {
        try {
            const [brands] = await db.query('SELECT brand_id, name FROM brands');
            return brands;
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách thương hiệu: " + error.message);
        }
    },

    createBrand: async (brandsData) => {
        try {
            const { name } = brandsData;
            const [result] = await db.query(
                'INSERT INTO brands (name) VALUES (?)',
                [name]
            );
            return { brand_id: result.insertId, name };
        } catch (error) {
            throw new Error("Lỗi khi tạo thương hiệu: " + error.message);
        }
    },

    updateBrand: async (brandId, brandData) => {
        try {
            const { name } = brandData;
            const [result] = await db.query(
                'UPDATE brands SET name = ? WHERE brand_id = ?',
                [name, brandId]
            );
            if (result.affectedRows === 0) {
                throw new Error("Thương hiệu không tồn tại");
            }
            return { brand_id: brandId, name };
        } catch (error) {
            throw new Error("Lỗi khi cập nhật thương hiệu: " + error.message);
        }
    },

    deleteBrand: async (brandId) => {
        try {
            // Kiểm tra xem thương hiệu có đang được sử dụng trong bảng products không
            const [products] = await db.query(
                'SELECT COUNT(*) as count FROM products WHERE brand_id = ?',
                [brandId]
            );
            
            if (products[0].count > 0) {
                throw new Error("Không thể xóa thương hiệu này vì đang có sản phẩm sử dụng");
            }

            const [result] = await db.query(
                'DELETE FROM brands WHERE brand_id = ?',
                [brandId]
            );
            if (result.affectedRows === 0) {
                throw new Error("Thương hiệu không tồn tại");
            }
            return true;
        } catch (error) {
            throw new Error("Lỗi khi xóa thương hiệu: " + error.message);
        }
    }
};

module.exports = BrandService; 