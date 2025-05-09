const BrandService = require('../services/brand.service');

const brandController = {
    getAllBrands: async (req, res) => {
        try {
            const brands = await BrandService.getAllBrands();
            res.json(brands);
        } catch (error) {
            console.error('Error getting brands:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách thương hiệu' });
        }
    },

    createBrand: async (req, res) => {
        try {
            const { name } = req.body;
    
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Tên thương hiệu không được để trống' });
            }
    
            const brand = await BrandService.createBrand({ name });
            res.status(201).json({
                message: 'Thêm thương hiệu thành công',
                brand
            });
        } catch (error) {
            console.error('Error creating brand:', error);
            res.status(500).json({ error: 'Lỗi khi thêm thương hiệu' });
        }
    },

    updateBrand: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
    
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Tên thương hiệu không được để trống' });
            }
    
            const brand = await BrandService.updateBrand(id, { name }); // Truyền object { name }
            res.json({
                message: 'Cập nhật thương hiệu thành công',
                brand
            });
        } catch (error) {
            console.error('Error updating brand:', error);
            if (error.message === 'Thương hiệu không tồn tại') {
                return res.status(404).json({ error: 'Không tìm thấy thương hiệu' });
            }
            res.status(500).json({ error: 'Lỗi khi cập nhật thương hiệu' });
        }
    },
    
    deleteBrand: async (req, res) => {
        try {
            const { id } = req.params;
            await BrandService.deleteBrand(id);
            res.json({ message: 'Xóa thương hiệu thành công' });
        } catch (error) {
            console.error('Error deleting brand:', error);
            if (error.message === 'Brand not found') {
                return res.status(404).json({ error: 'Không tìm thấy thương hiệu' });
            }
            if (error.message === 'Brand is in use') {
                return res.status(400).json({ error: 'Không thể xóa thương hiệu đang được sử dụng' });
            }
            res.status(500).json({ error: 'Lỗi khi xóa thương hiệu' });
        }
    }
};

module.exports = brandController;