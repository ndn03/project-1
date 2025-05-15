const commentService = require('../services/comment.service');

const commentController = {
    async getAllComments(req, res) {
        try {
            const comments = await commentService.getAllComments();
            res.json(comments);
        } catch (error) {
            console.error('[CommentController] Lỗi khi lấy danh sách đánh giá:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách đánh giá' });
        }
    },

    async getCommentsWithFilters(req, res) {
        try {
            const { id, date, rating, status } = req.query;
            const comments = await commentService.getCommentsWithFilters({ id, date, rating, status });
            res.json(comments);
        } catch (error) {
            console.error('[CommentController] Lỗi khi lọc đánh giá:', error);
            res.status(500).json({ error: 'Không thể lọc đánh giá' });
        }
    },

    async deleteComment(req, res) {
        const { id } = req.params;
        try {
            const success = await commentService.deleteComment(id);
            if (success) {
                res.json({ message: 'Xóa đánh giá thành công' });
            } else {
                res.status(404).json({ error: 'Không tìm thấy đánh giá để xóa' });
            }
        } catch (error) {
            console.error('[CommentController] Lỗi khi xóa đánh giá:', error);
            res.status(500).json({ error: 'Không thể xóa đánh giá' });
        }
    },

    async updateCommentStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        console.log('Update comment', id, 'to isActive:', isActive);
        try {
            const success = await commentService.updateCommentStatus(id, isActive);
            if (success) {
                res.json({ message: 'Cập nhật trạng thái đánh giá thành công' });
            } else {
                res.status(404).json({ error: 'Không tìm thấy đánh giá để cập nhật' });
            }
        } catch (error) {
            console.error('[CommentController] Lỗi khi cập nhật trạng thái đánh giá:', error);
            res.status(500).json({ error: 'Không thể cập nhật trạng thái đánh giá' });
        }
    }
};

module.exports = commentController;