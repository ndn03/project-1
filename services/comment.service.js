const db = require('../config/db');

const commentService = {
    async getAllComments() {
        try {
            const [comments] = await db.query(`
                SELECT r.review_id AS comment_id, r.comment AS content, r.rating, r.created_at, r.isActive, u.username, p.name AS product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN products p ON r.product_id = p.product_id
                ORDER BY r.created_at DESC
            `);
            return comments;
        } catch (error) {
            console.error('[CommentService] Lỗi khi lấy danh sách đánh giá:', error);
            throw new Error('Không thể lấy danh sách đánh giá');
        }
    },

    async getCommentsWithFilters({ id, date, rating, status }) {
        try {
            let sql = `
                SELECT r.review_id AS comment_id, r.comment AS content, r.rating, r.created_at, r.isActive, u.username, p.name AS product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN products p ON r.product_id = p.product_id
                WHERE 1=1
            `;
            const params = [];
            if (id) {
                sql += ' AND r.review_id = ?';
                params.push(id);
            }
            if (date) {
                sql += ' AND DATE(r.created_at) = ?';
                params.push(date);
            }
            if (rating) {
                sql += ' AND r.rating = ?';
                params.push(rating);
            }
            if (status !== undefined && status !== "") {
                sql += ' AND r.isActive = ?';
                params.push(status);
            }
            sql += ' ORDER BY r.created_at DESC';
            const [comments] = await db.query(sql, params);
            return comments;
        } catch (error) {
            console.error('[CommentService] Lỗi khi lọc đánh giá:', error);
            throw new Error('Không thể lọc đánh giá');
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

    async updateCommentStatus(commentId, isActive) {
        try {
            const [result] = await db.query('UPDATE reviews SET isActive = ? WHERE review_id = ?', [isActive, commentId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CommentService] Lỗi khi cập nhật trạng thái đánh giá:', error);
            throw new Error('Không thể cập nhật trạng thái đánh giá');
        }
    }
};

module.exports = commentService;