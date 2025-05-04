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

    async hideComment(req, res) {
        const { id } = req.params;
        try {
            const success = await commentService.hideComment(id);
            if (success) {
                res.json({ message: 'Ẩn đánh giá thành công' });
            } else {
                res.status(404).json({ error: 'Không tìm thấy đánh giá để ẩn' });
            }
        } catch (error) {
            console.error('[CommentController] Lỗi khi ẩn đánh giá:', error);
            res.status(500).json({ error: 'Không thể ẩn đánh giá' });
        }
    }
};

module.exports = commentController;