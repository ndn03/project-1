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
document.getElementById('password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
    }

    // Here you would typically make an API call to change the password
    alert('Đổi mật khẩu thành công!');
    this.reset();
});

// Fetch and render user's orders
async function loadUserOrders() {
    try {
        const res = await fetch('/orders/user', { credentials: 'include' });
        if (!res.ok) throw new Error('Không thể lấy lịch sử đơn hàng');
        const orders = await res.json();
        const tbody = document.getElementById('order-table-body');
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="4">Bạn chưa có đơn hàng nào.</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(order => {
            // Nếu có nhiều sản phẩm, hiển thị từng sản phẩm trong đơn
            let productRows = order.items.map(item => `
                <div style="margin-bottom:6px;">
                    <img src="${item.image_url}" alt="${item.product_name}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;">
                    <span>${item.product_name} x${item.quantity}</span>
                    ${(order.status === 'Đã giao hàng' && item.canReview) ? `<button class="review-btn" data-product-id="${item.product_id}" data-order-id="${order.order_id}">Đánh giá</button>` : ''}
                </div>
            `).join('');
            return `
                <tr>
                    <td>${order.order_id}<br>${productRows}</td>
                    <td>${order.created_at}</td>
                    <td>${order.final_amount.toLocaleString('vi-VN', {style:'currency', currency:'VND'})}</td>
                    <td>${order.status}</td>
                </tr>
            `;
        }).join('');
        // Gán sự kiện cho nút đánh giá
        document.querySelectorAll('.review-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                document.getElementById('review-product-id').value = productId;
                document.getElementById('review-popup').style.display = 'block';
            });
        });
    } catch (err) {
        document.getElementById('order-table-body').innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
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
if (reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const productId = document.getElementById('review-product-id').value;
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value.trim();
        if (!rating || !comment) return alert('Vui lòng nhập đủ thông tin đánh giá!');
        try {
            const res = await fetch('/orders/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ product_id: productId, rating, comment })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Đánh giá thành công!');
                closeReviewPopup();
                loadUserOrders(); // reload lại bảng
            } else {
                alert(data.error || 'Đánh giá thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        }
    });
}

// Gọi khi trang load
window.addEventListener('DOMContentLoaded', loadUserOrders);