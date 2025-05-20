const db = require("../config/db");

const ProductModel = {
    // Lấy danh sách sản phẩm theo danh mục
    getProductsByCategories: async () => {
        const query = `
            SELECT 
                p.product_id, 
                p.name, 
                p.price, 
                p.discount, 
                p.sold_quantity, 
                p.average_rating, 
                pi.image_url, 
                COALESCE(c.name, 'Chưa có danh mục') AS category_name,
                COALESCE(r.review_count, 0) AS review_count  
            FROM products p
            JOIN product_categories pc ON p.product_id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.category_id
            LEFT JOIN (
                SELECT product_id, MIN(image_url) AS image_url 
                FROM product_images 
                GROUP BY product_id
            ) pi ON p.product_id = pi.product_id
            LEFT JOIN (
                SELECT product_id, COUNT(review_id) AS review_count  
                FROM reviews
                GROUP BY product_id
            ) r ON p.product_id = r.product_id
            WHERE p.isActive = 1
            ORDER BY category_name ASC, p.product_id ASC;
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Lấy chi tiết sản phẩm theo id
    getProductDetailById: async (productId) => {
        const query = `
            SELECT 
                p.product_id, 
                p.name, 
                p.price,
                p.image_url, 
                p.discount, 
                p.sold_quantity, 
                p.stock_quantity,
                p.average_rating,
                pd.diameter, 
                pd.water_resistance_level, 
                pd.thickness, 
                pd.material_face, 
                pd.material_case, 
                pd.material_strap, 
                pd.size, 
                pd.movement, 
                pd.origin, 
                pd.warranty,
                COALESCE(c.name, 'Chưa có danh mục') AS category_name,
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count,
                GROUP_CONCAT(DISTINCT pi.image_url) AS images, 
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'review_id', r.review_id, 
                        'user_id', r.user_id, 
                        'username', u.username, 
                        'rating', r.rating, 
                        'comment', r.comment, 
                        'created_at', r.created_at
                    )
                ) AS reviews
            FROM products p
            LEFT JOIN product_details pd ON p.product_id = pd.product_id
            LEFT JOIN product_categories pc ON p.product_id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.category_id
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            LEFT JOIN reviews r ON p.product_id = r.product_id
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE p.product_id = ?
            GROUP BY p.product_id;
        `;
        const [rows] = await db.query(query, [productId]);
        console.log('Fetching product details for ID:', productId); // Debug log
        console.log('Query result:', rows); // Debug log
        if (rows.length) {
            const product = rows[0];
            product.images = product.images ? product.images.split(",") : [];
            product.reviews = product.reviews ? JSON.parse(`[${product.reviews}]`) : [];
            return product;
        }
        return null;
    },

    // Thêm sản phẩm mới
   createProduct: async (productData) => {
    const {
        name,
        brand_id,
        price,
        discount,
        image_url,
        stock_quantity,
        categories,
        details,
        images = []
    } = productData;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Thêm vào bảng products
        const [result] = await connection.query(
            `INSERT INTO products (name, brand_id, price, discount, image_url, stock_quantity)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [name, brand_id, price, discount, image_url, stock_quantity]
        );
        const productId = result.insertId;

        // Thêm vào bảng product_details
        if (details) {
            await connection.query(
                `INSERT INTO product_details (
                    product_id, diameter, water_resistance_level, thickness,
                    material_face, material_case, material_strap, size,
                    movement, origin, warranty
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    details.diameter,
                    details.water_resistance_level,
                    details.thickness,
                    details.material_face,
                    details.material_case,
                    details.material_strap,
                    details.size,
                    details.movement,
                    details.origin,
                    details.warranty
                ]
            );
        }

        // Thêm vào bảng product_categories
        if (categories && categories.length > 0) {
            const categoryValues = categories.map(categoryId => [productId, categoryId]);
            await connection.query(
                'INSERT INTO product_categories (product_id, category_id) VALUES ?',
                [categoryValues]
            );
        }

        // Thêm ảnh phụ vào bảng product_images
        if (images && images.length > 0) {
            const imageValues = images.map(imageUrl => [productId, imageUrl]);
            await connection.query(
                'INSERT INTO product_images (product_id, image_url) VALUES ?',
                [imageValues]
            );
        }

        await connection.commit();
        return productId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
},

updateProduct: async (productId, productData) => {
    const {
        name,
        brand_id,
        price,
        discount,
        image_url,
        stock_quantity,
        categories,
        details,
        images = [],
        imagesToDelete = []
    } = productData;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Cập nhật bảng products
        await connection.query(
            `UPDATE products 
            SET name = ?, brand_id = ?, price = ?, discount = ?, 
                image_url = ?, stock_quantity = ?
            WHERE product_id = ?`,
            [name, brand_id, price, discount, image_url, stock_quantity, productId]
        );

        // Cập nhật bảng product_details
        if (details) {
            await connection.query(
                `UPDATE product_details 
                SET diameter = ?, water_resistance_level = ?, thickness = ?,
                    material_face = ?, material_case = ?, material_strap = ?,
                    size = ?, movement = ?, origin = ?, warranty = ?
                WHERE product_id = ?`,
                [
                    details.diameter,
                    details.water_resistance_level,
                    details.thickness,
                    details.material_face,
                    details.material_case,
                    details.material_strap,
                    details.size,
                    details.movement,
                    details.origin,
                    details.warranty,
                    productId
                ]
            );
        }

        // Cập nhật bảng product_categories
        if (categories) {
            await connection.query(
                'DELETE FROM product_categories WHERE product_id = ?',
                [productId]
            );

            if (categories.length > 0) {
                const categoryValues = categories.map(categoryId => [productId, categoryId]);
                await connection.query(
                    'INSERT INTO product_categories (product_id, category_id) VALUES ?',
                    [categoryValues]
                );
            }
        }

        // Xóa ảnh trong imagesToDelete
        if (imagesToDelete.length > 0) {
            await connection.query(
                'DELETE FROM product_images WHERE product_id = ? AND image_url IN (?)',
                [productId, imagesToDelete]
            );
        }

        // Thêm ảnh mới
        if (images.length > 0) {
            const imageValues = images.map(imageUrl => [productId, imageUrl]);
            await connection.query(
                'INSERT INTO product_images (product_id, image_url) VALUES ?',
                [imageValues]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
},
    // Xóa sản phẩm (xóa mềm)
    deleteProduct: async (productId) => {
        const query = `UPDATE products SET isActive = 0 WHERE product_id = ?`;
        const [result] = await db.query(query, [productId]);
        return result.affectedRows > 0;
    },

    // Lấy sản phẩm theo bộ lọc và phân trang
    getProductsByFilters: async ({ brandId, categoryId, minPrice, maxPrice, sortBy, limit, offset }) => {
        // First get total count
        let countQuery = `
            SELECT COUNT(DISTINCT p.product_id) as total
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN product_categories pc ON p.product_id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.category_id
            WHERE p.isActive = 1
        `;
        const countParams = [];

        if (brandId) {
            countQuery += ` AND p.brand_id = ?`;
            countParams.push(brandId);
        }
        if (categoryId) {
            countQuery += ` AND pc.category_id = ?`;
            countParams.push(categoryId);
        }
        if (minPrice) {
            countQuery += ` AND p.price >= ?`;
            countParams.push(minPrice);
        }
        if (maxPrice) {
            countQuery += ` AND p.price <= ?`;
            countParams.push(maxPrice);
        }

        const [countResult] = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        // Then get products with pagination
        let query = `
            SELECT 
                p.product_id, 
                p.name, 
                p.price, 
                p.discount,
                p.stock_quantity,
                p.sold_quantity, 
                p.average_rating, 
                p.image_url,
                b.name as brand_name,
                GROUP_CONCAT(DISTINCT c.name) as category_names
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN product_categories pc ON p.product_id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.category_id
            WHERE p.isActive = 1
        `;
        const params = [...countParams];

        if (brandId) {
            query += ` AND p.brand_id = ?`;
        }
        if (categoryId) {
            query += ` AND pc.category_id = ?`;
        }
        if (minPrice) {
            query += ` AND p.price >= ?`;
        }
        if (maxPrice) {
            query += ` AND p.price <= ?`;
        }

        query += ` GROUP BY p.product_id`;

        if (sortBy === "price_asc") query += ` ORDER BY p.price ASC`;
        else if (sortBy === "price_desc") query += ` ORDER BY p.price DESC`;
        else if (sortBy === "sold_quantity") query += ` ORDER BY p.sold_quantity DESC`;
        else query += ` ORDER BY p.product_id DESC`;

        query += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await db.query(query, params);

        return {
            total,
            products
        };
    },

    getProductById: async (productId) => {
        const [rows] = await db.query(
            `SELECT 
                p.*,
                b.name as brand_name,
                pd.diameter,
                pd.water_resistance_level,
                pd.thickness,
                pd.material_face,
                pd.material_case,
                pd.material_strap,
                pd.size,
                pd.movement,
                pd.origin,
                pd.warranty,
                GROUP_CONCAT(DISTINCT c.name) as category_names,
                GROUP_CONCAT(DISTINCT pi.image_url) as additional_images
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN product_details pd ON p.product_id = pd.product_id
            LEFT JOIN product_categories pc ON p.product_id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.category_id
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            WHERE p.product_id = ? AND p.isActive = 1
            GROUP BY p.product_id`,
            [productId]
        );
        return rows[0];
    }
};

module.exports = ProductModel;