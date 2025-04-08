// Hàm load giỏ hàng khi trang được tải
async function loadCart() {
    try {
        const response = await fetch("http://localhost:3333/cart", { 
            method: "GET",
            credentials: "include" // Gửi cookie kèm yêu cầu
        });
        if (response.ok) {
            const htmlContent = await response.text();
            const cartContainer = document.getElementById("cart-container");
            if (cartContainer) {
                cartContainer.innerHTML = htmlContent;
                attachCartEventListeners(); // Gán lại sự kiện sau khi nội dung được cập nhật
            } else {
                console.error("Không tìm thấy cart-container trong DOM");
            }
        } else {
            const errorHtml = await response.text();
            alert("Không thể tải giỏ hàng: " + response.status);
            const cartContainer = document.getElementById("cart-container");
            if (cartContainer) cartContainer.innerHTML = errorHtml;
        }
    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
        alert("Lỗi kết nối server khi tải giỏ hàng: " + error.message);
    }
}

// Hàm gửi request có đính kèm cookie
async function fetchWithAuth(url, options = {}) {
    options.credentials = "include"; // Gửi cookie kèm yêu cầu
    let response = await fetch(url, options);

    // Xử lý trường hợp token hết hạn (401)
    if (response.status === 401) {
        console.log("Token expired or invalid, attempting to refresh");
        const refreshResponse = await fetch("http://localhost:3333/auth/refreshToken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include" // Gửi cookie refreshToken
        });

        if (refreshResponse.ok) {
            console.log("Token refreshed, retrying request");
            response = await fetch(url, { ...options, credentials: "include" });
        } else {
            console.log("Refresh token failed, redirecting to login");
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
            window.location.href = "/";
            return null; // Trả về null để xử lý lỗi
        }
    }

    return response;
}

// Hàm gán sự kiện cho các nút trong giỏ hàng
function attachCartEventListeners() {
    const prevBtn = document.querySelector('.prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentReviewIndex = (currentReviewIndex - reviewsPerPage + totalReviews) % totalReviews;
            showReviews(currentReviewIndex);
        });
    }

    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentReviewIndex = (currentReviewIndex + reviewsPerPage) % totalReviews;
            showReviews(currentReviewIndex);
        });
    }

    // Xóa sản phẩm
    document.querySelectorAll('.delete-form').forEach(form => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const cartItemId = form.action.split('/').pop();

            try {
                const response = await fetchWithAuth(`/cart/remove/${cartItemId}`, {
                    method: 'DELETE'
                });

                if (response && response.ok) {
                    alert('Sản phẩm đã được xóa khỏi giỏ hàng');
                    await loadCart(); // Tải lại giỏ hàng
                } else if (response) {
                    const result = await response.json();
                    alert(result.error || 'Có lỗi khi xóa sản phẩm');
                }
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra khi xóa sản phẩm');
            }
        });
    });

    // Cập nhật số lượng
    document.querySelectorAll('input[data-cart-item-id]').forEach(input => {
        input.addEventListener('change', async () => {
            const cartItemId = input.dataset.cartItemId;
            const quantity = parseInt(input.value);

            if (quantity < 1) {
                alert('Số lượng phải lớn hơn 0');
                input.value = input.defaultValue;
                return;
            }

            try {
                const response = await fetchWithAuth('/cart/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cart_item_id: cartItemId, quantity })
                });

                if (response && response.ok) {
                    alert('Số lượng đã được cập nhật');
                    await loadCart(); // Tải lại giỏ hàng
                } else if (response) {
                    const result = await response.json();
                    alert(result.error || 'Có lỗi khi cập nhật số lượng');
                    input.value = input.defaultValue;
                }
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra khi cập nhật số lượng');
                input.value = input.defaultValue;
            }
        });
    });
}

// Gọi loadCart khi trang được tải
window.addEventListener("DOMContentLoaded", loadCart);