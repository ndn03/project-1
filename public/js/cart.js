async function loadCart() {
    try {
        const response = await fetch("http://localhost:3333/cart", {
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
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: "Lỗi không xác định" }));
            alert("Không thể tải giỏ hàng: " + (errorData.message || response.status));
        }
    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
        alert("Lỗi kết nối server khi tải giỏ hàng: " + error.message);
    }
}

async function fetchWithAuth(url, options = {}) {
    options.credentials = "include";
    options.headers = options.headers || {};
    options.headers["X-Requested-With"] = "XMLHttpRequest";
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

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            try {
                const cartResponse = await fetchWithAuth("http://localhost:3333/cart", {
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
                    console.warn("Không tìm thấy cart-table trong dữ liệu giỏ hàng");
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

            const fullName = document.getElementById('full-name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const provinceId = document.getElementById('province').value;
            const districtId = document.getElementById('district').value;
            const wardId = document.getElementById('ward').value;
            const streetAddress = document.getElementById('street-address').value.trim();
            const paymentMethodId = document.getElementById('payment-method').value;
            const note = document.getElementById('note').value.trim();

            if (!fullName || !phone || !provinceId || !districtId || !wardId || !streetAddress || !paymentMethodId) {
                alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
                return;
            }

            const cartResponse = await fetchWithAuth("http://localhost:3333/cart", {
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
                }
            };

            try {
                console.log("Gửi request tạo đơn hàng với body:", JSON.stringify(orderData));
                const response = await fetchWithAuth('http://localhost:3333/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                if (response && response.ok) {
                    const result = await response.json();
                    window.location.href = `/orders/${result.order.order_id}`;
                } else if (response) {
                    const data = await response.json();
                    console.error("Lỗi từ server:", data);
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
                const orderFormContainer = document.getElementById('order-form-container');
                if (orderFormContainer) {
                    orderFormContainer.style.display = 'none';
                    orderForm.reset();
                }
            });
        }
    } else {
        console.warn("Không tìm thấy order-form trong DOM");
    }
}

window.addEventListener("DOMContentLoaded", loadCart);