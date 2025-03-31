const productService = require("../services/product.service");

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm" });
  }
};
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy thông tin sản phẩm" });
  }
};

const createProduct = async (req, res) => {
  try {
    const newProduct = await productService.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi tạo sản phẩm" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await productService.updateProduct(
      req.params.id,
      req.body
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật sản phẩm" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: "Sản phẩm đã được xóa" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa sản phẩm" });
  }
};


module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
