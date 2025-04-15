async function loadCart() {
    try {
        const response = await fetch("http://localhost:3333/cart", {
            method: "GET",
            credentials: "include",
            headers: {
                "X-Requested-With": "XMLHttpRequest" // Thêm header để server nhận biết request AJAX
            }
        });

        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                // Nếu response là JSON (trường hợp lỗi)
                const data = await response.json();
                alert(data.message || "Không thể tải giỏ hàng");
                return;
            }

            const htmlContent = await response.text();
            const cartContainer = document.getElementById("cart-container");
            if (cartContainer) {
                cartContainer.innerHTML = htmlContent;
                attachCartEventListeners();
            } else {
                console.error("Không tìm thấy cart-container trong DOM");
            }
        } else {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                alert(data.message || "Không thể tải giỏ hàng: " + response.status);
            } else {
                const errorHtml = await response.text();
                alert("Không thể tải giỏ hàng: " + response.status);
                const cartContainer = document.getElementById("cart-container");
                if (cartContainer) cartContainer.innerHTML = errorHtml;
            }
        }
    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
        alert("Lỗi kết nối server khi tải giỏ hàng: " + error.message);
    }
}

async function fetchWithAuth(url, options = {}) {
    options.credentials = "include";
    options.headers = options.headers || {};
    options.headers["X-Requested-With"] = "XMLHttpRequest"; // Thêm header cho tất cả request
    let response = await fetch(url, options);

    if (response.status === 401) {
        console.log("Token expired or invalid, attempting to refresh");
        const refreshResponse = await fetch("http://localhost:3333/auth/refreshToken", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
            credentials: "include"
        });

        if (refreshResponse.ok) {
            console.log("Token refreshed, retrying request");
            response = await fetch(url, { ...options, credentials: "include" });
        } else {
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
            window.location.href = "/";
            return null;
        }
    }

    return response;
}

function attachCartEventListeners() {
    // Xóa sản phẩm
    document.querySelectorAll('.delete-form').forEach(form => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const cartItemId = form.action.split('/').pop();

            try {
                const response = await fetchWithAuth(`http://localhost:3333/cart/remove/${cartItemId}`, {
                    method: 'DELETE'
                });

                if (response && response.ok) {
                    alert('Sản phẩm đã được xóa khỏi giỏ hàng');
                    await loadCart();
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

    // Nút + và -
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const cartItemId = btn.dataset.cartItemId;
            const isIncrement = btn.classList.contains('plus-btn');
            const input = document.querySelector(`input[data-cart-item-id="${cartItemId}"]`);
            if (!input) {
                console.error(`Không tìm thấy input cho cartItemId: ${cartItemId}`);
                return;
            }

            let quantity = parseInt(input.value) || 1;

            // Cập nhật số lượng
            quantity = isIncrement ? quantity + 1 : Math.max(1, quantity - 1);

            // Cập nhật giá trị hiển thị ngay lập tức
            input.value = quantity;

            try {
                const response = await fetchWithAuth('http://localhost:3333/cart/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cart_item_id: cartItemId, quantity })
                });

                if (response && response.ok) {
                    await loadCart();
                } else if (response) {
                    const result = await response.json();
                    alert(result.error || 'Có lỗi khi cập nhật số lượng');
                    input.value = isIncrement ? quantity - 1 : quantity + 1;
                }
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi khi cập nhật số lượng');
                input.value = isIncrement ? quantity - 1 : quantity + 1;
            }
        });
    });

    // Gửi mã voucher
    const voucherForm = document.getElementById('voucher-form');
    if (voucherForm) {
        voucherForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const voucherInput = document.getElementById('voucher-code');
            if (!voucherInput) {
                console.error("Không tìm thấy ô input voucher-code");
                alert("Lỗi giao diện: Không tìm thấy ô nhập mã giảm giá");
                return;
            }

            const code = voucherInput.value.trim();
            console.log("Mã voucher gửi đi:", code);

            if (!code) {
                alert("Vui lòng nhập mã giảm giá.");
                return;
            }

            try {
                console.log("Gửi request apply-voucher với body:", JSON.stringify({ code }));
                const response = await fetchWithAuth('http://localhost:3333/cart/apply-voucher', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                if (response && response.ok) {
                    alert('Áp dụng voucher thành công!');
                    await loadCart();
                } else if (response) {
                    const data = await response.json();
                    console.error("Lỗi từ server:", data);
                    alert(data.error || 'Không thể áp dụng voucher');
                }
            } catch (error) {
                console.error('Lỗi khi áp dụng voucher:', error);
                alert('Có lỗi xảy ra khi áp dụng voucher');
            }
        });
    } else {
        console.warn("Không tìm thấy voucher-form trong DOM");
    }
}

window.addEventListener("DOMContentLoaded", loadCart);