const OverviewService = require('../services/overview.service');

const getOverview = async (req, res) => {
    console.log('Bắt đầu xử lý API /admin/api/overview');
    try {
        const overviewData = await OverviewService.getOverview();
        console.log('Dữ liệu tổng quan:', overviewData);
        res.json(overviewData);
    } catch (error) {
        console.error('Lỗi trong getOverview controller:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu tổng quan' });
    }
};

module.exports = {
    getOverview
};