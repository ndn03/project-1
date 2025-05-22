const CategoryService = require('../services/category.service');

const categoryController = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await CategoryService.getAllCategories();
            res.json(categories);
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách danh mục' });
        }
    },

    createCategory: async (req, res) => {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Tên danh mục không được để trống' });
            }

            const category = await CategoryService.createCategory({ name });
            res.status(201).json({
                message: 'Thêm danh mục thành công',
                category
            });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Lỗi khi thêm danh mục' });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Tên danh mục không được để trống' });
            }

            const category = await CategoryService.updateCategory(id, { name });
            res.json({
                message: 'Cập nhật danh mục thành công',
                category
            });
        } catch (error) {
            console.error('Error updating category:', error);
            if (error.message === 'Category not found') {
                return res.status(404).json({ error: 'Không tìm thấy danh mục' });
            }
            res.status(500).json({ error: 'Lỗi khi cập nhật danh mục' });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            await CategoryService.deleteCategory(id);
            res.json({ message: 'Xóa danh mục thành công' });
        } catch (error) {
            console.error('Error deleting category:', error);
            if (error.message.includes('Không thể xóa danh mục này vì đang có sản phẩm sử dụng')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message === 'Category not found') {
                return res.status(404).json({ error: 'Không tìm thấy danh mục' });
            }
            res.status(500).json({ error: 'Lỗi khi xóa danh mục' });
        }
    }
};

module.exports = categoryController; 