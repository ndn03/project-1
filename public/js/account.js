let ordersData = []; // Lưu trữ danh sách đơn hàng
let eventListeners = []; // Quản lý sự kiện để tránh rò rỉ bộ nhớ

// Handle menu navigation
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(menu => {
            menu.classList.remove('active');
        });
        
        // Add active class to clicked menu item
        this.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const sectionId = this.getAttribute('href').substring(1);
        document.getElementById(sectionId).classList.add('active');
    });
});

// Handle password change form submission
document.getElementById('password-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
    }

    try {
        const res = await fetch('/auth/changePassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });
        const data = await res.json();
        if (res.ok) {
            // Hiển thị xác nhận đăng xuất
            if (confirm('Đổi mật khẩu thành công!\nBạn có muốn đăng xuất ngay không?')) {
                await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.href = 'http://localhost:3333/';
            } else {
                alert('Bạn đã đổi mật khẩu thành công!');
                this.reset();
            }
        } else {
            alert(data.message || 'Đổi mật khẩu thất bại!');
        }
    } catch (err) {
        alert('Lỗi kết nối server!');
    }
});

// Fetch and render user's orders
async function loadUserOrders() {
    try {
        const tbody = document.getElementById('order-table-body');
        tbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';

        const res = await fetch('/user-orders', { credentials: 'include' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Không thể lấy lịch sử đơn hàng');
        }
        ordersData = await res.json();

        if (!ordersData || ordersData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Bạn chưa có đơn hàng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        ordersData.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${order.order_id}</td>
                <td>${new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td>${Number(order.final_amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                <td>${order.status || 'Chờ xác nhận'}</td>
                <td><button class="view-details-btn" data-order-id="${order.order_id}">Xem chi tiết</button></td>
            `;
            tbody.appendChild(tr);

            const detailsRow = document.createElement('tr');
            detailsRow.className = 'order-details-row';
            detailsRow.id = `details-${order.order_id}`;
            detailsRow.style.display = 'none';
            detailsRow.innerHTML = `
                <td colspan="5">
                    <div><strong>Người nhận:</strong> ${order.receiver_name || 'Không xác định'}</div>
                    <div><strong>Số điện thoại:</strong> ${order.receiver_phone || 'Không xác định'}</div>
                    <div><strong>Thành tiền:</strong> ${Number(order.final_amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</div>
                    <div><strong>Phí vận chuyển:</strong> ${Number(order.shipping_fee || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</div>
                    <div><strong>Giảm giá:</strong> ${Number(order.discount_amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</div>
                    <div><strong>Phương thức thanh toán:</strong> ${order.payment_method || 'Không xác định'}</div>
                    <div><strong>Tổng tiền:</strong> ${Number(order.total_amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</div>
                    <div><strong>Địa chỉ:</strong> ${order.full_address || 'Không xác định'}</div>
                    <div><strong>Ghi chú:</strong> ${order.note || 'Không có ghi chú'}</div>
                    <table class="order-details-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Giá</th>
                                <th>Tổng</th>
                                <th>Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>
                                        <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.product_name || 'Sản phẩm'}" class="product-image">
                                        ${item.product_name || 'Sản phẩm'}
                                    </td>
                                    <td>${item.quantity || 0}</td>
                                    <td>${Number(item.price || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                                    <td>${Number((item.quantity || 0) * (item.price || 0)).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                                    <td>
                                        <button class="review-btn" data-order-id="${order.order_id}" data-product-id="${item.product_id}">Đánh giá</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </td>
            `;
            tbody.appendChild(detailsRow);
        });

        // Attach event listeners for view details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            const handler = () => {
                const orderId = btn.dataset.orderId;
                const detailsRow = document.getElementById(`details-${orderId}`);
                const isVisible = detailsRow.style.display === 'table-row';
                detailsRow.style.display = isVisible ? 'none' : 'table-row';
                btn.textContent = isVisible ? 'Xem chi tiết' : 'Ẩn chi tiết';
            };
            btn.addEventListener('click', handler);
            eventListeners.push({ element: btn, event: 'click', handler });
        });

        // Attach event listeners for review buttons
        document.querySelectorAll('.review-btn').forEach(button => {
            const handler = () => {
                const orderId = button.getAttribute('data-order-id');
                const productId = button.getAttribute('data-product-id');
                // Tìm order trong ordersData
                const order = ordersData.find(o => String(o.order_id) === String(orderId));
                if (order && order.status !== 'Hoàn thành') {
                    alert('Bạn chỉ có thể đánh giá sản phẩm khi đơn hàng đã hoàn thành!');
                    return;
                }
                document.getElementById('review-order-id').value = orderId;
                document.getElementById('review-product-id').value = productId;
                document.getElementById('review-popup').style.display = 'block';
            };
            button.addEventListener('click', handler);
            eventListeners.push({ element: button, event: 'click', handler });
        });

    } catch (err) {
        document.getElementById('order-table-body').innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
    }
}

// Đóng popup đánh giá
function closeReviewPopup() {
    document.getElementById('review-popup').style.display = 'none';
    document.getElementById('review-form').reset();
}
document.getElementById('close-review-popup').onclick = closeReviewPopup;
window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('review-popup')) closeReviewPopup();
});

// Gửi đánh giá sản phẩm
const reviewForm = document.getElementById('review-form');
// Ngăn chặn sự kiện submit bị kích hoạt nhiều lần
let isSubmitting = false;
if (reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isSubmitting) return; // Nếu đang xử lý, không cho phép gửi thêm
        isSubmitting = true;

        const productId = document.getElementById('review-product-id').value;
        const orderId = document.getElementById('review-order-id').value;
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value.trim();
        if (!rating || !comment) {
            alert('Vui lòng nhập đủ thông tin đánh giá!');
            isSubmitting = false;
            return;
        }
        try {
            const res = await fetch(`/orders/${orderId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating, comment })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Đánh giá thành công!');
                closeReviewPopup();
                loadUserOrders(); // Reload bảng đơn hàng
            } else {
                alert(data.error || 'Đánh giá thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        } finally {
            isSubmitting = false; // Cho phép gửi lại sau khi xử lý xong
        }
    });
}

// JavaScript for toggle password visibility
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            this.innerHTML = '<i class="fa fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            this.innerHTML = '<i class="fa fa-eye"></i>';
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserOrders();
});

// ========== ĐÁNH GIÁ CỦA TÔI ========== //
async function loadUserReviews() {
    const tbody = document.getElementById('user-reviews-body');
    tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';
    try {
        const res = await fetch('/user/reviews', { credentials: 'include' });
        if (!res.ok) throw new Error('Không thể lấy danh sách đánh giá');
        const reviews = await res.json();
        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Bạn chưa có đánh giá nào.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        reviews.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.product_name}</td>
                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                <td>${r.content}</td>
                <td>${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                <td>${r.isActive ? 'Hiển thị' : 'Đã ẩn'}</td>
                <td>
                    <button class="edit-review-btn" data-id="${r.comment_id}" data-rating="${r.rating}" data-content="${encodeURIComponent(r.content)}">Sửa</button>
                    <button class="delete-review-btn" data-id="${r.comment_id}">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        // Gán sự kiện cho nút sửa
        document.querySelectorAll('.edit-review-btn').forEach(btn => {
            btn.onclick = function() {
                document.getElementById('edit-review-id').value = btn.dataset.id;
                document.getElementById('edit-review-rating').value = btn.dataset.rating;
                document.getElementById('edit-review-comment').value = decodeURIComponent(btn.dataset.content);
                document.getElementById('edit-review-popup').style.display = 'block';
            };
        });
        // Gán sự kiện cho nút xóa
        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.onclick = function() {
                const reviewId = btn.dataset.id;
                document.getElementById('delete-review-popup').style.display = 'block';
                document.getElementById('confirm-delete-review').onclick = async function() {
                    try {
                        const res = await fetch(`/user/reviews/${reviewId}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        if (res.ok) {
                            alert('Xóa đánh giá thành công!');
                            closeDeleteReviewPopup();
                            loadUserReviews();
                        } else {
                            const data = await res.json();
                            alert(data.error || 'Xóa đánh giá thất bại!');
                        }
                    } catch (err) {
                        alert('Lỗi kết nối server!');
                    }
                };
                document.getElementById('cancel-delete-review').onclick = closeDeleteReviewPopup;
            };
        });
        // Gán sự kiện cho nút bỏ ẩn
        document.querySelectorAll('.unhide-review-btn').forEach(btn => {
            btn.onclick = async function() {
                const reviewId = btn.dataset.id;
                try {
                    const res = await fetch(`/api/comments/${reviewId}/hide`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ isActive: 1 })
                    });
                    if (res.ok) {
                        alert('Đánh giá đã được hiển thị lại!');
                        loadUserReviews();
                    } else {
                        const data = await res.json();
                        alert(data.error || 'Không thể hiển thị lại đánh giá!');
                    }
                } catch (err) {
                    alert('Lỗi kết nối server!');
                }
            };
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
    }
}

// Đóng popup xác nhận xóa đánh giá
function closeDeleteReviewPopup() {
    document.getElementById('delete-review-popup').style.display = 'none';
}
document.getElementById('close-delete-review-popup').onclick = closeDeleteReviewPopup;
document.getElementById('cancel-delete-review').onclick = closeDeleteReviewPopup;

// Đóng popup sửa đánh giá
function closeEditReviewPopup() {
    document.getElementById('edit-review-popup').style.display = 'none';
    document.getElementById('edit-review-form').reset();
}
document.getElementById('close-edit-review-popup').onclick = closeEditReviewPopup;
window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('edit-review-popup')) closeEditReviewPopup();
});

// Xử lý submit sửa đánh giá
const editReviewForm = document.getElementById('edit-review-form');
if (editReviewForm) {
    editReviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('edit-review-id').value;
        const rating = document.getElementById('edit-review-rating').value;
        const comment = document.getElementById('edit-review-comment').value.trim();
        if (!rating || !comment) {
            alert('Vui lòng nhập đủ thông tin!');
            return;
        }
        try {
            const res = await fetch(`/user/reviews/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating, comment })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Cập nhật đánh giá thành công!');
                closeEditReviewPopup();
                loadUserReviews();
            } else {
                alert(data.error || 'Cập nhật đánh giá thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        }
    });
}

// Khi chuyển sang tab "Đánh giá của tôi" thì load danh sách đánh giá
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', function() {
        if (this.getAttribute('href') === '#user-reviews') {
            loadUserReviews();
        }
    });
});