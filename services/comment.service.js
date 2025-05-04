const db = require('../config/db');

const commentService = {
    async getAllComments() {
        try {
            const [comments] = await db.query(`
                SELECT r.review_id AS comment_id, r.comment AS content, r.rating, r.created_at, u.username, p.name AS product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN products p ON r.product_id = p.product_id
                WHERE r.isActive = 1
                ORDER BY r.created_at DESC
            `);
            return comments;
        } catch (error) {
            console.error('[CommentService] Lỗi khi lấy danh sách đánh giá:', error);
            throw new Error('Không thể lấy danh sách đánh giá');
        }
    },

    async deleteComment(commentId) {
        try {
            const [result] = await db.query('DELETE FROM reviews WHERE review_id = ?', [commentId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CommentService] Lỗi khi xóa đánh giá:', error);
            throw new Error('Không thể xóa đánh giá');
        }
    },

    async hideComment(commentId) {
        try {
            const [result] = await db.query('UPDATE reviews SET isActive = 0 WHERE review_id = ?', [commentId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CommentService] Lỗi khi ẩn đánh giá:', error);
            throw new Error('Không thể ẩn đánh giá');
        }
    }
};

module.exports = commentService;