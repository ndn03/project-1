const ProductService = require("../services/product.service");

const getAllProducts = async (req, res) => {
    try {
        const { limit, offset, brandId, categoryId, minPrice, maxPrice, sortBy } = req.query;
        
        // Validate query parameters
        if (limit && (isNaN(limit) || limit < 1)) {
            return res.status(400).json({ error: "Limit phải là số dương" });
        }
        if (offset && (isNaN(offset) || offset < 0)) {
            return res.status(400).json({ error: "Offset phải là số không âm" });
        }
        if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
            return res.status(400).json({ error: "Giá tối thiểu phải là số không âm" });
        }
        if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
            return res.status(400).json({ error: "Giá tối đa phải là số không âm" });
        }
        if (minPrice && maxPrice && minPrice > maxPrice) {
            return res.status(400).json({ error: "Giá tối thiểu không được lớn hơn giá tối đa" });
        }

        const products = await ProductService.getAllProducts({
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
            brandId: parseInt(brandId),
            categoryId: parseInt(categoryId),
            minPrice: parseFloat(minPrice),
            maxPrice: parseFloat(maxPrice),
            sortBy
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm: " + error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: "ID sản phẩm không hợp lệ" });
        }

        const product = await ProductService.getProductDetail(productId);
        if (!product) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm: " + error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { product, details, images, categories } = req.body;

        // Validate required fields
        if (!product?.name || !product?.price || !product?.brand_id) {
            return res.status(400).json({ 
                error: "Thiếu thông tin bắt buộc",
                required: {
                    name: "Tên sản phẩm",
                    price: "Giá sản phẩm",
                    brand_id: "ID thương hiệu"
                }
            });
        }

        // Validate price
        if (isNaN(product.price) || product.price < 0) {
            return res.status(400).json({ error: "Giá sản phẩm không hợp lệ" });
        }

        // Validate stock quantity
        if (product.stock_quantity && (isNaN(product.stock_quantity) || product.stock_quantity < 0)) {
            return res.status(400).json({ error: "Số lượng tồn kho không hợp lệ" });
        }

        // Validate discount
        if (product.discount && (isNaN(product.discount) || product.discount < 0 || product.discount > 100)) {
            return res.status(400).json({ error: "Giảm giá phải từ 0 đến 100" });
        }

        const newProduct = await ProductService.createProduct(req.body);
        res.status(201).json({
            message: "Tạo sản phẩm thành công",
            productId: newProduct.productId
        });
    } catch (error) {
        res.status(400).json({ error: "Lỗi khi tạo sản phẩm: " + error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: "ID sản phẩm không hợp lệ" });
        }

        const { product, details, images, categories } = req.body;

        // Validate required fields
        if (!product?.name || !product?.price || !product?.brand_id) {
            return res.status(400).json({ 
                error: "Thiếu thông tin bắt buộc",
                required: {
                    name: "Tên sản phẩm",
                    price: "Giá sản phẩm",
                    brand_id: "ID thương hiệu"
                }
            });
        }

        // Validate price
        if (isNaN(product.price) || product.price < 0) {
            return res.status(400).json({ error: "Giá sản phẩm không hợp lệ" });
        }

        // Validate stock quantity
        if (product.stock_quantity && (isNaN(product.stock_quantity) || product.stock_quantity < 0)) {
            return res.status(400).json({ error: "Số lượng tồn kho không hợp lệ" });
        }

        // Validate discount
        if (product.discount && (isNaN(product.discount) || product.discount < 0 || product.discount > 100)) {
            return res.status(400).json({ error: "Giảm giá phải từ 0 đến 100" });
        }

        const updatedProduct = await ProductService.updateProduct(productId, req.body);
        res.json({
            message: "Cập nhật sản phẩm thành công",
            productId: updatedProduct.productId
        });
    } catch (error) {
        res.status(400).json({ error: "Lỗi khi cập nhật sản phẩm: " + error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: "ID sản phẩm không hợp lệ" });
        }

        await ProductService.deleteProduct(productId);
        res.json({ 
            message: "Xóa sản phẩm thành công",
            productId: productId
        });
    } catch (error) {
        res.status(400).json({ error: "Lỗi khi xóa sản phẩm: " + error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};