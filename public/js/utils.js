// Hàm hiển thị thông báo tạm thời
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) {
        // Nếu không có div notification, hiển thị thông báo mặc định
        console.log(message);
        return;
    }
    notification.innerHTML = message; // Hỗ trợ HTML (ví dụ: link "Xem giỏ hàng")
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000); // Ẩn sau 3 giây
}

export { showNotification };