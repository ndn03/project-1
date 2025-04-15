document.addEventListener('DOMContentLoaded', () => {
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    const checkoutForm = document.getElementById('checkout-form');

    // Load danh sách tỉnh
    fetch('https://provinces.open-api.vn/api/p/')
        .then(response => response.json())
        .then(provinces => {
            provinces.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.code;
                option.textContent = prov.name;
                provinceSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Lỗi tải tỉnh:', error));

    // Load quận/huyện khi chọn tỉnh
    provinceSelect.addEventListener('change', () => {
        const provinceId = provinceSelect.value;
        districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
        wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';

        if (provinceId) {
            fetch(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`)
                .then(response => response.json())
                .then(data => {
                    data.districts.forEach(dist => {
                        const option = document.createElement('option');
                        option.value = dist.code;
                        option.textContent = dist.name;
                        districtSelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Lỗi tải quận/huyện:', error));
        }
    });

    // Load phường/xã khi chọn quận/huyện
    districtSelect.addEventListener('change', () => {
        const districtId = districtSelect.value;
        wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';

        if (districtId) {
            fetch(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`)
                .then(response => response.json())
                .then(data => {
                    data.wards.forEach(ward => {
                        const option = document.createElement('option');
                        option.value = ward.code;
                        option.textContent = ward.name;
                        wardSelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Lỗi tải phường/xã:', error));
        }
    });

    // Xử lý đặt hàng
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(checkoutForm);
        const data = {
            cart_id: formData.get('cart_id'),
            payment_method_id: formData.get('payment_method_id'),
            shipping_address: {
                province_id: formData.get('province_id'),
                district_id: formData.get('district_id'),
                ward_id: formData.get('ward_id'),
                street_address: formData.get('street_address')
            }
        };

        try {
            const response = await fetch('/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                const htmlContent = await response.text();
                document.body.innerHTML = htmlContent; // Chuyển sang trang xác nhận
            } else {
                const result = await response.json();
                alert(result.error || 'Có lỗi khi đặt hàng');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra khi đặt hàng');
        }
    });
});