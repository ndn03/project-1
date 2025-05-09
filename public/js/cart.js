async function loadCart() {
    try {
        console.log("Đang gọi API giỏ hàng...");
        const response = await fetch("http://localhost:3333/cart/content", {
            method: "GET",
            credentials: "include",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        if (response.ok) {
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                alert(data.message || "Không thể tải giỏ hàng");
                return;
            }

            const htmlContent = await response.text();
            const cartContainer = document.getElementById("cart-container");
            if (cartContainer) {
                cartContainer.innerHTML = htmlContent;
                attachCartEventListeners();
                loadProvinces();
            } else {
                console.error("Không tìm thấy cart-container trong DOM");
                alert("Lỗi giao diện: Không tìm thấy container giỏ hàng");
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: "Lỗi không xác định" }));
            console.error("Lỗi API:", errorData);
            alert("Không thể tải giỏ hàng: " + (errorData.message || response.status));
        }
    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
        alert("Lỗi kết nối server khi tải giỏ hàng: " + error.message);
    }
}

// Giữ nguyên các hàm khác từ artifact trước
async function fetchWithAuth(url, options = {}) {
    options.credentials = "include";
    options.headers = options.headers || {};
    options.headers["X-Requested-With"] = "XMLHttpRequest";
    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshResponse = await fetch("http://localhost:3333/auth/refreshToken", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
            credentials: "include"
        });

        if (refreshResponse.ok) {
            response = await fetch(url, { ...options, credentials: "include" });
        } else {
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
            window.location.href = "/";
            return null;
        }
    }

    return response;
}

async function loadProvinces() {
    try {
        const response = await fetch("http://localhost:3333/proxy/provinces");
        const provinces = await response.json();
        const provinceSelect = document.getElementById("province");
        provinceSelect.innerHTML = '<option value="">Chọn tỉnh/thành phố</option>';
        provinces.forEach(province => {
            const option = document.createElement("option");
            option.value = province.code;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Lỗi tải danh sách tỉnh:", error);
        alert("Không thể tải danh sách tỉnh/thành phố: " + error.message);
    }
}

async function loadDistricts(provinceId) {
    try {
        const response = await fetch(`http://localhost:3333/proxy/districts/${provinceId}`);
        const districts = await response.json();
        const districtSelect = document.getElementById("district");
        districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
        districts.forEach(district => {
            const option = document.createElement("option");
            option.value = district.code;
            option.textContent = district.name;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
        const wardSelect = document.getElementById("ward");
        wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
        wardSelect.disabled = true;
    } catch (error) {
        console.error("Lỗi tải danh sách quận/huyện:", error);
        alert("Không thể tải danh sách quận/huyện: " + error.message);
    }
}

async function loadWards(districtId) {
    try {
        const response = await fetch(`http://localhost:3333/proxy/wards/${districtId}`);
        const wards = await response.json();
        const wardSelect = document.getElementById("ward");
        wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
        wards.forEach(ward => {
            const option = document.createElement("option");
            option.value = ward.code;
            option.textContent = ward.name;
            wardSelect.appendChild(option);
        });
        wardSelect.disabled = false;
    } catch (error) {
        console.error("Lỗi tải danh sách phường/xã:", error);
        alert("Không thể tải danh sách phường/xã: " + error.message);
    }
}

function attachCartEventListeners() {
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
            quantity = isIncrement ? quantity + 1 : Math.max(1, quantity - 1);
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
            if (!code) {
                alert("Vui lòng nhập mã giảm giá.");
                return;
            }

            try {
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
                    alert(data.error || 'Không thể áp dụng voucher');
                }
            } catch (error) {
                console.error('Lỗi khi áp dụng voucher:', error);
                alert('Có lỗi xảy ra khi áp dụng voucher');
            }
        });
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            try {
                const cartResponse = await fetchWithAuth("http://localhost:3333/cart/content", {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                if (!cartResponse || !cartResponse.ok) {
                    alert("Không thể lấy dữ liệu giỏ hàng: " + (await cartResponse?.json()?.message || cartResponse.status));
                    return;
                }

                const cartContent = await cartResponse.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(cartContent, 'text/html');
                const cartTable = doc.querySelector('.cart-table');
                const productsTable = document.getElementById('products-table');
                if (productsTable && cartTable) {
                    productsTable.innerHTML = cartTable.outerHTML;
                } else if (!cartTable) {
                    productsTable.innerHTML = '<p>Giỏ hàng trống hoặc không có sản phẩm.</p>';
                } else {
                    console.error("Không tìm thấy products-table trong form");
                }
            } catch (error) {
                console.error("Lỗi khi lấy giỏ hàng cho form:", error);
                alert("Không thể lấy dữ liệu giỏ hàng: " + error.message);
            }
        });
    }

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        const provinceSelect = document.getElementById('province');
        provinceSelect.addEventListener('change', (event) => {
            const provinceId = event.target.value;
            if (provinceId) {
                loadDistricts(provinceId);
            } else {
                const districtSelect = document.getElementById('district');
                const wardSelect = document.getElementById('ward');
                districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
                districtSelect.disabled = true;
                wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
                wardSelect.disabled = true;
            }
        });

        const districtSelect = document.getElementById('district');
        districtSelect.addEventListener('change', (event) => {
            const districtId = event.target.value;
            if (districtId) {
                loadWards(districtId);
            } else {
                const wardSelect = document.getElementById('ward');
                wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
                wardSelect.disabled = true;
            }
        });

        orderForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const receiverName = document.getElementById('full-name').value.trim();
            const receiverPhone = document.getElementById('phone').value.trim();
            const provinceId = document.getElementById('province').value;
            const districtId = document.getElementById('district').value;
            const wardId = document.getElementById('ward').value;
            const streetAddress = document.getElementById('street-address').value.trim();
            const paymentMethodId = document.getElementById('payment-method').value;
            const note = document.getElementById('note').value.trim();

            if (!receiverName || !receiverPhone || !provinceId || !districtId || !wardId || !streetAddress || !paymentMethodId) {
                alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
                return;
            }

            const cartResponse = await fetchWithAuth("http://localhost:3333/cart/content", {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (!cartResponse || !cartResponse.ok) {
                alert("Không thể lấy thông tin giỏ hàng: " + (await cartResponse?.json()?.message || cartResponse.status));
                return;
            }

            const cartContent = await cartResponse.text();
            if (!cartContent.includes('cart-table')) {
                alert("Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi đặt hàng.");
                return;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(cartContent, 'text/html');
            const cartTable = doc.querySelector('.cart-table');
            const productsTable = document.getElementById('products-table');
            if (productsTable && cartTable) {
                productsTable.innerHTML = cartTable.outerHTML;
            }

            const cartDataResponse = await fetchWithAuth("http://localhost:3333/cart/data", {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (!cartDataResponse || !cartDataResponse.ok) {
                alert("Không thể lấy dữ liệu giỏ hàng: " + (await cartDataResponse?.json()?.message || cartDataResponse.status));
                return;
            }

            const cartData = await cartDataResponse.json();
            const cartId = cartData.cart_id;

            if (!cartId) {
                alert("Không tìm thấy cart_id!");
                return;
            }

            const orderData = {
                cart_id: cartId,
                payment_method_id: paymentMethodId,
                shipping_address: {
                    province_id: provinceId,
                    district_id: districtId,
                    ward_id: wardId,
                    street_address: streetAddress
                },
                receiver_name: receiverName,
                receiver_phone: receiverPhone,
                note: note
            };

            try {
                const response = await fetchWithAuth('http://localhost:3333/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                if (response && response.ok) {
                    const result = await response.json();
                    showOrderConfirmationModal(result.order);
                } else if (response) {
                    const data = await response.json();
                    alert(data.error || 'Không thể đặt hàng');
                }
            } catch (error) {
                console.error('Lỗi khi đặt hàng:', error);
                alert('Có lỗi xảy ra khi đặt hàng: ' + error.message);
            }
        });

        const cancelOrderBtn = document.getElementById('cancel-order-btn');
        if (cancelOrderBtn) {
            cancelOrderBtn.addEventListener('click', () => {
                orderForm.reset();
                alert("Đã hủy nhập thông tin đặt hàng.");
            });
        }
    }
}

function showOrderConfirmationModal(order) {
    // Tạo HTML popup hiện đại
    const modalHtml = `
    <div id="order-confirmation-modal" class="order-success-modal">
        <div class="order-success-modal-content">
            <span class="order-success-close-btn" id="close-order-modal">&times;</span>
            <div class="order-success-icon">
                <i class="fa fa-check-circle"></i>
            </div>
            <h2>Đặt hàng thành công!</h2>
            <div class="order-success-info">
                <p><strong>Mã đơn hàng:</strong> #${order.order_id}</p>
                <p><strong>Người nhận:</strong> ${order.receiver_name}</p>
                <p><strong>Số điện thoại:</strong> ${order.receiver_phone}</p>
                <p><strong>Địa chỉ:</strong> ${order.full_address}</p>
                <p><strong>Phương thức thanh toán:</strong> ${order.method_name || order.payment_method_name || ''}</p>
                <p><strong>Trạng thái:</strong> ${order.status_name || order.status || ''}</p>
                <p><strong>Tổng tiền:</strong> ${Number(order.total_amount).toLocaleString('vi-VN')} VND</p>
                <p><strong>Phí vận chuyển:</strong> ${Number(order.shipping_fee).toLocaleString('vi-VN')} VND</p>
                <p><strong>Giảm giá:</strong> ${Number(order.discount_amount).toLocaleString('vi-VN')} VND</p>
                <p><strong>Thành tiền:</strong> <b>${Number(order.final_amount).toLocaleString('vi-VN')} VND</b></p>
            </div>
            <h3>Chi tiết sản phẩm</h3>
            <div class="order-success-products">
                <table>
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Giá</th>
                            <th>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(order.items || []).map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>${item.quantity}</td>
                                <td>${Number(item.price).toLocaleString('vi-VN')} VND</td>
                                <td>${(item.quantity * item.price).toLocaleString('vi-VN')} VND</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button id="close-order-modal-btn" class="btn order-success-btn">Đóng</button>
        </div>
    </div>
    <style>
    .order-success-modal {
        position: fixed; z-index: 2000; left: 0; top: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s;
    }
    .order-success-modal-content {
        background: #fffbe7;
        border-radius: 16px;
        padding: 36px 24px 24px 24px;
        max-width: 480px;
        width: 95vw;
        box-shadow: 0 8px 32px rgba(44,44,44,0.18);
        position: relative;
        animation: fadeInUp 0.4s;
    }
    .order-success-close-btn {
        position: absolute; right: 18px; top: 12px; font-size: 2rem; color: #D4A017; cursor: pointer; transition: color 0.2s;
    }
    .order-success-close-btn:hover { color: #1A2B44; }
    .order-success-icon {
        text-align: center; margin-bottom: 12px;
    }
    .order-success-icon i {
        color: #28a745; font-size: 3.5rem; animation: popIn 0.5s;
    }
    .order-success-modal-content h2 {
        color: #D4A017; text-align: center; margin-bottom: 10px; font-size: 2rem;
    }
    .order-success-info {
        margin-bottom: 12px; font-size: 1.05rem;
    }
    .order-success-info p { margin: 2px 0; }
    .order-success-products {
        overflow-x: auto; margin-bottom: 18px;
    }
    .order-success-products table {
        width: 100%; border-collapse: collapse; font-size: 0.98rem;
    }
    .order-success-products th, .order-success-products td {
        border: 1px solid #e5e5e5; padding: 6px 8px; text-align: center;
    }
    .order-success-products th {
        background: #f8f1e9; color: #D4A017;
    }
    .order-success-btn {
        display: block; margin: 0 auto; background: #D4A017; color: #fff; border-radius: 8px; padding: 10px 32px; font-size: 1.1rem; font-weight: 600; border: none; transition: background 0.2s;
    }
    .order-success-btn:hover { background: #1A2B44; color: #fffbe7; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px);} to { opacity: 1; transform: none; } }
    @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @media (max-width: 600px) {
        .order-success-modal-content { padding: 18px 4vw 18px 4vw; }
        .order-success-modal-content h2 { font-size: 1.2rem; }
    }
    </style>
    `;

    // Xóa modal cũ nếu có
    const oldModal = document.getElementById('order-confirmation-modal');
    if (oldModal) oldModal.remove();

    // Thêm modal vào body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = document.getElementById('order-confirmation-modal');
    modal.style.display = 'flex';

    // Đóng modal khi bấm nút hoặc dấu X
    document.getElementById('close-order-modal').onclick = () => modal.remove();
    document.getElementById('close-order-modal-btn').onclick = () => modal.remove();

    // Đóng modal khi click ra ngoài
    window.addEventListener('mousedown', function handler(event) {
        if (event.target === modal) {
            modal.remove();
            window.removeEventListener('mousedown', handler);
        }
    });
}

window.addEventListener("DOMContentLoaded", loadCart);