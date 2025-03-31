const db = require("../config/db");

const ProductModel = {
    // Lấy danh sách sản phẩm theo danh mục
    getProductsByCategories: async () => {
        const query = `
            SELECT 
                p.id AS product_id, 
                p.name, 
                p.price, 
                p.discount, 
                p.sold_quantity, 
                p.average_rating, 
                pi.image_url, 
                COALESCE(c.name, 'Chưa có danh mục') AS category_name,
                COALESCE(r.review_count, 0) AS review_count  
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN (
                SELECT product_id, MIN(image_url) AS image_url 
                FROM product_images 
                GROUP BY product_id
            ) pi ON p.id = pi.product_id
            LEFT JOIN (
                SELECT product_id, COUNT(id) AS review_count  
                FROM reviews
                GROUP BY product_id
            ) r ON p.id = r.product_id
            WHERE p.isActive = 1
            ORDER BY category_name ASC, p.id ASC;
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Lấy chi tiết sản phẩm theo id
    getProductDetailById: async (productId) => {
        const query = `
            SELECT 
                p.id AS product_id, 
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
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count,
                GROUP_CONCAT(DISTINCT pi.image_url) AS images, 
                GROUP_CONCAT(
                    DISTINCT JSON_OBJECT(
                        'review_id', r.id, 
                        'user_id', r.user_id, 
                        'username', u.username, 
                        'rating', r.rating, 
                        'comment', r.comment, 
                        'created_at', r.created_at
                    )
                ) AS reviews
            FROM products p
            LEFT JOIN product_details pd ON p.id = pd.product_id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id
            LEFT JOIN reviews r ON p.id = r.product_id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE p.id = ?
            GROUP BY p.id;
        `;
        const [rows] = await db.query(query, [productId]);
        if (rows.length) {
            const product = rows[0];
            product.images = product.images ? product.images.split(",") : [];
            product.reviews = product.reviews ? JSON.parse(`[${product.reviews}]`) : [];
            return product;
        }
        return null;
    }
};

module.exports = ProductModel;
