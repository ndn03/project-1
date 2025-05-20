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
    },

    // Lấy tất cả đánh giá của user hiện tại
    async getUserComments(req, res) {
        try {
            const userId = req.user.user_id;
            const comments = await commentService.getCommentsByUserId(userId);
            res.json(comments);
        } catch (error) {
            console.error('[CommentController] Lỗi khi lấy đánh giá của user:', error);
            res.status(500).json({ error: 'Không thể lấy đánh giá của bạn' });
        }
    },

    // Cho phép user sửa đánh giá của chính mình
    async updateUserComment(req, res) {
        try {
            const userId = req.user.user_id;
            const { id } = req.params;
            const { rating, comment } = req.body;
            if (!rating || !comment) {
                return res.status(400).json({ error: 'Thiếu thông tin đánh giá' });
            }
            const success = await commentService.updateUserComment(userId, id, rating, comment);
            if (success) {
                res.json({ message: 'Cập nhật đánh giá thành công' });
            } else {
                res.status(404).json({ error: 'Không tìm thấy hoặc không có quyền sửa đánh giá này' });
            }
        } catch (error) {
            console.error('[CommentController] Lỗi khi cập nhật đánh giá:', error);
            res.status(500).json({ error: 'Không thể cập nhật đánh giá' });
        }
    },

    // Cho phép user xóa đánh giá của chính mình
    async deleteUserComment(req, res) {
        try {
            const userId = req.user.user_id;
            const { id } = req.params;
            const success = await commentService.deleteUserComment(userId, id);
            if (success) {
                res.json({ message: 'Xóa đánh giá thành công' });
            } else {
                res.status(404).json({ error: 'Không tìm thấy hoặc không có quyền xóa đánh giá này' });
            }
        } catch (error) {
            console.error('[CommentController] Lỗi khi xóa đánh giá:', error);
            res.status(500).json({ error: 'Không thể xóa đánh giá' });
        }
    }
};

module.exports = commentController;