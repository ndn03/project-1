const db = require("../config/db");

const OverviewService = {
    getOverview: async () => {
        try {
            console.log('Bắt đầu lấy dữ liệu tổng quan từ cơ sở dữ liệu');

            // Get total products
            console.log('Truy vấn tổng số sản phẩm');
            const [productsResult] = await db.query(
                'SELECT COUNT(*) as total FROM products WHERE isActive = 1'
            );
            const totalProducts = productsResult[0].total;

            // Get total customers
            console.log('Truy vấn tổng số khách hàng');
            const [customersResult] = await db.query(
                'SELECT COUNT(*) as total FROM users WHERE role = "customer" AND isActive = 1'
            );
            const totalCustomers = customersResult[0].total;

            // Get pending orders
            console.log('Truy vấn đơn hàng chờ xác nhận');
            const [pendingOrdersResult] = await db.query(
                `SELECT COUNT(*) as total 
                FROM orders o 
                JOIN order_status os ON o.status_id = os.order_status_id 
                WHERE os.status = 'Chờ xác nhận'`
            );
            const pendingOrders = pendingOrdersResult[0].total;

            // Get completed orders
            console.log('Truy vấn đơn hàng hoàn thành');
            const [completedOrdersResult] = await db.query(
                `SELECT COUNT(*) as total 
                FROM orders o 
                JOIN order_status os ON o.status_id = os.order_status_id 
                WHERE os.status = 'Hoàn thành'`
            );
            const completedOrders = completedOrdersResult[0].total;

            // Get total revenue - Cập nhật điều kiện tính doanh thu
            console.log('Truy vấn doanh thu tổng quan');
            const [revenueResult] = await db.query(
                `SELECT 
                    COALESCE(SUM(final_amount), 0) as total_revenue,
                    COALESCE(SUM(CASE 
                        WHEN DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = CURDATE() THEN final_amount 
                        ELSE 0 
                    END), 0) as today_revenue,
                    COALESCE(SUM(CASE 
                        WHEN DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN final_amount 
                        ELSE 0 
                    END), 0) as yesterday_revenue,
                    COALESCE(SUM(CASE 
                        WHEN DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN final_amount 
                        ELSE 0 
                    END), 0) as week_revenue,
                    COALESCE(SUM(CASE 
                        WHEN DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN final_amount 
                        ELSE 0 
                    END), 0) as month_revenue
                FROM orders o 
                JOIN order_status os ON o.status_id = os.order_status_id 
                WHERE os.status = 'Hoàn thành'`
            );

            const {
                total_revenue,
                today_revenue,
                yesterday_revenue,
                week_revenue,
                month_revenue
            } = revenueResult[0];

            // Get top 5 best-selling products by sold_quantity
            console.log('Truy vấn top 5 sản phẩm bán chạy');
            const [topSellingResult] = await db.query(
                `SELECT product_id, name, image_url, price, sold_quantity
                 FROM products
                 WHERE isActive = 1
                 ORDER BY sold_quantity DESC
                 LIMIT 5`
            );

            // Get all categories
            const [categories] = await db.query('SELECT category_id, name FROM categories');
            // Get all brands
            const [brands] = await db.query('SELECT brand_id, name FROM brands');
            // Get all payment methods
            const [paymentMethods] = await db.query('SELECT payment_method_id, name FROM payment_methods');

            return {
                totalProducts,
                totalCustomers,
                pendingOrders,
                completedOrders,
                totalRevenue: total_revenue,
                revenueDetails: {
                    today: today_revenue,
                    yesterday: yesterday_revenue,
                    week: week_revenue,
                    month: month_revenue
                },
                topSellingProducts: topSellingResult,
                categories,
                brands,
                paymentMethods
            };
        } catch (error) {
            console.error('Error in getOverview:', error);
            throw new Error('Lỗi khi lấy dữ liệu tổng quan');
        }
    }
};

module.exports = OverviewService;