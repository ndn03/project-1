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
        console.log('Creating product, req.body:', req.body); // Thêm log
        console.log('Uploaded files:', req.files); // Thêm log

        const mainImageFile = req.files && req.files['main_image'] && req.files['main_image'][0];
        const image_url = mainImageFile ? '/img/' + mainImageFile.filename : '';

        // Lấy ảnh phụ
        const images = req.files && req.files['additional_images']
            ? req.files['additional_images'].map(f => '/img/' + f.filename)
            : [];

        if (!req.body.data) {
            return res.status(400).json({ error: "Thiếu trường data trong yêu cầu" });
        }

        let parsedData;
        try {
            parsedData = JSON.parse(req.body.data);
            console.log('Parsed data:', parsedData);
        } catch (parseError) {
            return res.status(400).json({ error: `Dữ liệu JSON không hợp lệ: ${parseError.message}` });
        }

        const { product, details, categories, imagesToDelete = [] } = parsedData;

        if (!product) {
            return res.status(400).json({ error: "Thiếu đối tượng product trong dữ liệu" });
        }

        if (!product.name || !product.price || !product.brand_id) {
            return res.status(400).json({ 
                error: "Thiếu thông tin bắt buộc",
                required: {
                    name: "Tên sản phẩm",
                    price: "Giá sản phẩm",
                    brand_id: "ID thương hiệu"
                },
                received: product
            });
        }

        if (typeof product.name !== 'string' || product.name.trim().length < 2) {
            return res.status(400).json({ error: "Tên sản phẩm phải là chuỗi và dài ít nhất 2 ký tự" });
        }
        if (typeof product.price !== 'number' || product.price <= 0) {
            return res.status(400).json({ error: "Giá sản phẩm phải là số dương" });
        }
        if (typeof product.brand_id !== 'number' || product.brand_id <= 0) {
            return res.status(400).json({ error: "ID thương hiệu phải là số dương" });
        }

        const newProduct = await ProductService.createProduct({
            product: { ...product, image_url },
            details,
            images,
            categories,
            imagesToDelete
        });
        res.status(201).json({
            message: "Tạo sản phẩm thành công",
            productId: newProduct.productId
        });
    } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(400).json({ error: "Lỗi khi tạo sản phẩm: " + error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        console.log('Updating product, req.body:', req.body); // Thêm log
        console.log('Uploaded files:', req.files); // Thêm log

        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: "ID sản phẩm không hợp lệ" });
        }

        // Kiểm tra sản phẩm có tồn tại
        const existingProduct = await ProductService.getProductById(productId);
        if (!existingProduct) {
            return res.status(404).json({ error: "Sản phẩm không tồn tại" });
        }

        // Xử lý file ảnh đại diện (main_image)
        let image_url = null;
        if (req.files && req.files.length > 0) {
            // Tìm file main_image (nếu có)
            const mainImageFile = req.files.find(f => f.fieldname === 'main_image');
            if (mainImageFile) {
                image_url = '/img/' + mainImageFile.filename;
            }
        }

        // Xử lý ảnh phụ
        const additionalImages = req.files ? req.files.filter(f => f.fieldname === 'additional_images').map(f => '/img/' + f.filename) : [];

        if (!req.body.data) {
            return res.status(400).json({ error: "Thiếu trường data trong yêu cầu" });
        }

        let parsedData;
        try {
            parsedData = JSON.parse(req.body.data);
            console.log('Parsed data:', parsedData);
        } catch (parseError) {
            return res.status(400).json({ error: `Dữ liệu JSON không hợp lệ: ${parseError.message}` });
        }

        const { product, details, categories, imagesToDelete = [] } = parsedData;

        if (!product) {
            return res.status(400).json({ error: "Thiếu đối tượng product trong dữ liệu" });
        }

        if (!product.name || !product.price || !product.brand_id) {
            return res.status(400).json({ 
                error: "Thiếu thông tin bắt buộc",
                required: {
                    name: "Tên sản phẩm",
                    price: "Giá sản phẩm",
                    brand_id: "ID thương hiệu"
                },
                received: product
            });
        }

        if (typeof product.name !== 'string' || product.name.trim().length < 2) {
            return res.status(400).json({ error: "Tên sản phẩm phải là chuỗi và dài ít nhất 2 ký tự" });
        }
        if (typeof product.price !== 'number' || product.price <= 0) {
            return res.status(400).json({ error: "Giá sản phẩm phải là số dương" });
        }
        if (typeof product.brand_id !== 'number' || product.brand_id <= 0) {
            return res.status(400).json({ error: "ID thương hiệu phải là số dương" });
        }

        // Nếu không có ảnh đại diện mới thì lấy ảnh cũ từ product.image_url
        if (!image_url && product.image_url) {
            image_url = product.image_url;
        }

        const updatedProduct = await ProductService.updateProduct(productId, {
            product: { ...product, image_url },
            details,
            images: additionalImages,
            categories,
            imagesToDelete
        });
        res.json({
            message: "Cập nhật sản phẩm thành công",
            productId: updatedProduct.productId
        });
    } catch (error) {
        console.error('Error in updateProduct:', error);
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