const productForm = document.getElementById('product-form-content');
const productList = document.getElementById('product-list');
let currentPage = 1;
let currentFilters = {};
let orderStatuses = [];

// Tải danh sách sản phẩm với phân trang và bộ lọc
async function loadProducts(page = 1, filters = {}) {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            limit,
            offset,
            ...filters
        });

        const response = await fetch(`/admin/api/products?${queryParams}`, {
            credentials: 'include'
        });
        
        if (response.status === 403) {
            window.location.href = '/login';
            return;
        }
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // Nếu không phải JSON, lấy text (có thể là HTML)
                const text = await response.text();
                console.error('Error response (not JSON):', text);
                showNotification('Lỗi server: ' + text.slice(0, 100), 'error');
                return;
            }
            console.error('Error response from server:', errorData);
            showNotification(errorData.error || 'Lỗi khi lưu sản phẩm', 'error');
            return;
        }
        
        const data = await response.json();
        
        // Cập nhật phân trang
        const totalPages = Math.ceil(data.total / limit);
        updatePagination({
            currentPage: page,
            totalPages: totalPages
        });
        
        // Hiển thị danh sách sản phẩm
        displayProducts(data.products || []);
        
        // Cập nhật các phần tử tổng quan và các bảng khác
        updateOverview(data);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification(error.message || 'Lỗi khi tải danh sách sản phẩm', 'error');
    }
}

// Hiển thị danh sách sản phẩm trong bảng
function displayProducts(products) {
    if (!products || products.length === 0) {
        productList.innerHTML = '<tr><td colspan="8" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }

    productList.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.image_url || '/img/no-image.png'}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${product.name}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.discount ? product.discount + '%' : '-'}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>${product.brand_name || '-'}</td>
            <td>${product.category_names ? product.category_names.split(',').join(', ') : '-'}</td>
            <td>
                <div class="actions">
                    <button onclick="showProductDetail(${product.product_id})" class="btn-detail">
                        <i class="fas fa-info-circle"></i> Chi tiết
                    </button>
                    <button onclick="editProduct(${product.product_id})" class="btn-edit">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button onclick="deleteProduct(${product.product_id})" class="btn-delete">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Cập nhật điều khiển phân trang
function updatePagination(pagination) {
    if (!pagination) return;
    
    const { currentPage, totalPages } = pagination;
    document.getElementById('page-info').textContent = `Trang ${currentPage} / ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

// Cập nhật thống kê tổng quan
function updateOverview(overview) {
    if (!overview) return;
    
    const elTotalProducts = document.getElementById('total-products');
    if (elTotalProducts) elTotalProducts.textContent = overview.totalProducts;

    const elTotalCustomers = document.getElementById('total-customers');
    if (elTotalCustomers) elTotalCustomers.textContent = overview.totalCustomers;

    const elPendingOrders = document.getElementById('pending-orders');
    if (elPendingOrders) elPendingOrders.textContent = overview.pendingOrders;

    const elCompletedOrders = document.getElementById('completed-orders');
    if (elCompletedOrders) elCompletedOrders.textContent = overview.completedOrders;

    const elTotalRevenue = document.getElementById('total-revenue');
    if (elTotalRevenue) elTotalRevenue.textContent = formatPrice(overview.totalRevenue);
    
    // Cập nhật chi tiết doanh thu
    if (overview.revenueDetails) {
        const elToday = document.getElementById('today-revenue');
        if (elToday) elToday.textContent = formatPrice(overview.revenueDetails.today);

        const elYesterday = document.getElementById('yesterday-revenue');
        if (elYesterday) elYesterday.textContent = formatPrice(overview.revenueDetails.yesterday);

        const elWeek = document.getElementById('week-revenue');
        if (elWeek) elWeek.textContent = formatPrice(overview.revenueDetails.week);

        const elMonth = document.getElementById('month-revenue');
        if (elMonth) elMonth.textContent = formatPrice(overview.revenueDetails.month);
    }

    // Hiển thị top 5 sản phẩm bán chạy
    const topSellingProductsList = document.getElementById('top-selling-products-list');
    if (topSellingProductsList) {
        if (overview.topSellingProducts && overview.topSellingProducts.length > 0) {
            topSellingProductsList.innerHTML = overview.topSellingProducts.map(product => `
                <div class="top-product-card">
                    <img src="${product.image_url}" alt="${product.name}" class="top-product-img">
                    <div class="top-product-info">
                        <div class="top-product-name">${product.name}</div>
                        <div class="top-product-price">${formatPrice(product.price)}</div>
                        <div class="top-product-sold">Đã bán: <b>${product.sold_quantity}</b></div>
                    </div>
                </div>
            `).join('');
        } else {
            topSellingProductsList.innerHTML = '<div class="no-top-product">Không có sản phẩm nào.</div>';
        }
    }

    // Hiển thị danh mục, thương hiệu, phương thức thanh toán nếu có
    if (overview.categories && overview.brands && overview.paymentMethods) {
        renderListInfo(overview.categories, overview.brands, overview.paymentMethods);
    }
}

// Định dạng giá tiền sang VND
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Hiển thị form sản phẩm để chỉnh sửa
async function editProduct(productId) {
    try {
        const response = await fetch(`/admin/api/products/${productId}`);
        if (!response.ok) throw new Error('Không thể lấy thông tin sản phẩm');
        const data = await response.json();
        const product = {
            ...data.product,
            details: data.details || {},
            additional_images: data.images || [],
            categories: data.product?.categories || []
        };
        showProductForm(product);
    } catch (error) {
        showNotification('Lỗi khi tải thông tin sản phẩm', 'error');
    }
}

// Hiển thị form sản phẩm với dữ liệu chi tiết
function showProductForm(product = null) {
    const form = document.getElementById('product-form');
    const title = document.getElementById('form-title');

    title.textContent = product ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới';

    // Reset các biến quản lý ảnh
    oldImages = [];
    imagesToDelete = [];
    selectedAdditionalImages = [];
    if (additionalImagesInput) additionalImagesInput.value = '';

    if (product) {
        document.getElementById('product-id').value = product.product_id || '';
        document.getElementById('product-name').value = product.name || 'Tên sản phẩm chưa xác định';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-discount').value = product.discount || '';
        document.getElementById('product-stock').value = product.stock_quantity || '';
        document.getElementById('product-brand').value = product.brand_id || '';
        window.currentImageUrl = product.image_url || '';

        // Gán thương hiệu
        if (product.brand_id) {
            const brandSelect = document.getElementById('product-brand');
            if (brandSelect) {
                brandSelect.value = product.brand_id;
            }
        }

        // Gán danh mục
        if (product.categories) {
            const categoryCheckboxes = document.querySelectorAll('input[name="product-categories"]');
            categoryCheckboxes.forEach(checkbox => {
                checkbox.checked = product.categories.includes(parseInt(checkbox.value));
            });
        }

        // Gán hình ảnh bổ sung cũ
        oldImages = (product.additional_images || []).map(img => {
            if (img.startsWith('/img/')) return img; // Path is already correct
            if (img.startsWith('DonghoVip/') || img.startsWith('DonghoNam/') || img.startsWith('DonghoNu/')) {
                return '/img/' + img; // Add '/img/' for subdirectories
            }
            return img; // Return as is for other cases
        });
        renderAdditionalImagesPreview();

        // Gán thông tin chi tiết sản phẩm
        const details = product.details || {};
        document.getElementById('product-diameter').value = details.diameter || '';
        document.getElementById('product-water-resistance').value = details.water_resistance_level || '';
        document.getElementById('product-thickness').value = details.thickness || '';
        document.getElementById('product-material-face').value = details.material_face || '';
        document.getElementById('product-material-case').value = details.material_case || '';
        document.getElementById('product-material-strap').value = details.material_strap || '';
        document.getElementById('product-size').value = details.size || '';
        document.getElementById('product-movement').value = details.movement || '';
        document.getElementById('product-origin').value = details.origin || '';
        document.getElementById('product-warranty').value = details.warranty || '';
    } else {
        document.getElementById('product-id').value = '';
        window.currentImageUrl = '';
        renderAdditionalImagesPreview();
    }

    form.style.display = 'block';
}

// Xóa hình ảnh bổ sung
function removeImage(imageUrl) {
    const additionalImagesContainer = document.getElementById('additional-images-container');
    const imageElement = Array.from(additionalImagesContainer.children).find(child => child.querySelector('img').src === imageUrl);
    if (imageElement) {
        additionalImagesContainer.removeChild(imageElement);
    }
}

// Ẩn form sản phẩm
function hideProductForm() {
    document.getElementById('product-form').style.display = 'none';
    document.getElementById('product-form-content').reset();
}

// --- Preview nhiều ảnh khi chọn file ---
const additionalImagesInput = document.getElementById('additional-images');
const additionalImagesContainer = document.getElementById('additional-images-container');
let selectedAdditionalImages = [];
let oldImages = [];
let imagesToDelete = [];

if (additionalImagesInput) {
    additionalImagesInput.addEventListener('change', function (e) {
        selectedAdditionalImages = Array.from(e.target.files);
        renderAdditionalImagesPreview();
    });
}

function renderAdditionalImagesPreview() {
    additionalImagesContainer.innerHTML = '';
    console.log('Debugging oldImages:', oldImages); // Debugging log

    // Preview ảnh cũ (nếu có)
    oldImages.forEach((imgUrl, idx) => {
        if (!imagesToDelete.includes(imgUrl)) {
            const div = document.createElement('div');
            div.className = 'image-preview old-image';
            div.innerHTML = `
                <img src="${imgUrl}" alt="Ảnh cũ">
                <button type="button" class="btn-delete" data-idx="${idx}">Xóa</button>
            `;
            div.querySelector('.btn-delete').onclick = function() {
                imagesToDelete.push(imgUrl);
                div.remove();
            };
            additionalImagesContainer.appendChild(div);
        }
    });

    // Preview ảnh mới
    selectedAdditionalImages.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = function (ev) {
            const div = document.createElement('div');
            div.className = 'image-preview new-image';
            div.innerHTML = `
                <img src="${ev.target.result}" alt="Additional Image">
                <button type="button" class="btn-delete" data-idx="${idx}">Xóa</button>
            `;
            div.querySelector('.btn-delete').onclick = function() {
                selectedAdditionalImages.splice(idx, 1);
                const dt = new DataTransfer();
                selectedAdditionalImages.forEach(f => dt.items.add(f));
                additionalImagesInput.files = dt.files;
                div.remove();
            };
            additionalImagesContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

// --- Sửa handleProductSubmit để gửi danh sách ảnh cần xóa ---
async function handleProductSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productId = formData.get('product-id')?.trim();
    
    // Thu thập dữ liệu sản phẩm
    const selectedCategories = Array.from(document.querySelectorAll('input[name="product-categories"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

    const productData = {
        name: formData.get('product-name')?.trim(),
        price: parseFloat(formData.get('product-price')),
        discount: parseFloat(formData.get('product-discount')) || 0,
        stock_quantity: parseInt(formData.get('product-stock')),
        brand_id: parseInt(formData.get('product-brand'))
    };

    // Lấy file ảnh đại diện mới nếu có
    const productImagesInput = document.getElementById('product-images');
    let hasNewMainImage = false;
    if (productImagesInput && productImagesInput.files && productImagesInput.files.length > 0) {
        hasNewMainImage = true;
    }
    if (!hasNewMainImage && window.currentImageUrl) {
        productData.image_url = window.currentImageUrl;
    }

    const details = {
        diameter: formData.get('product-diameter'),
        water_resistance_level: formData.get('product-water-resistance'),
        thickness: formData.get('product-thickness'),
        material_face: formData.get('product-material-face'),
        material_case: formData.get('product-material-case'),
        material_strap: formData.get('product-material-strap'),
        size: formData.get('product-size'),
        movement: formData.get('product-movement'),
        origin: formData.get('product-origin'),
        warranty: formData.get('product-warranty')
    };

    // Kiểm tra các trường bắt buộc
    if (!productData.name || productData.name.length < 2) {
        showNotification('Tên sản phẩm phải dài ít nhất 2 ký tự', 'error');
        return;
    }
    if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
        showNotification('Giá sản phẩm phải là số dương', 'error');
        return;
    }
    if (!productData.brand_id || isNaN(productData.brand_id) || productData.brand_id <= 0) {
        showNotification('Vui lòng chọn thương hiệu hợp lệ', 'error');
        return;
    }

    // Tạo dữ liệu gửi lên backend
    const data = {
        product: productData,
        details,
        categories: selectedCategories,
        imagesToDelete: Array.isArray(imagesToDelete) ? imagesToDelete : []
    };

    // Chuẩn bị FormData
    const sendData = new FormData();
    sendData.append('data', JSON.stringify(data));

    // Thêm tệp ảnh đại diện mới nếu có
    if (hasNewMainImage) {
        sendData.append('main_image', productImagesInput.files[0]);
    }

    // Thêm tệp ảnh phụ
    const files = additionalImagesInput?.files;
    if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            sendData.append('additional_images', files[i]);
        }
    }

    // Log dữ liệu để kiểm tra
    console.log('Action:', productId ? 'Updating product' : 'Creating product');
    console.log('Product ID from form:', productId);
    console.log('Data to send:', JSON.stringify(data, null, 2));
    for (let pair of sendData.entries()) {
        console.log('FormData:', pair[0], pair[1]);
    }

    try {
        const url = productId ? `/admin/api/products/${productId}` : '/admin/api/products';
        const method = productId ? 'PUT' : 'POST';
        console.log('Sending request to:', url, 'Method:', method);

        const response = await fetch(url, {
            method: method,
            body: sendData,
            credentials: 'include'
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                showNotification('Lỗi server: Không thể phân tích phản hồi JSON', 'error');
                return;
            }
            console.error('Error response from server:', errorData);
            showNotification(errorData.error || 'Lỗi khi lưu sản phẩm', 'error');
            return;
        }

        const responseData = await response.json();
        showNotification(productId ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công', 'success');
        hideProductForm();
        loadProducts(currentPage, currentFilters);
    } catch (error) {
        console.error('Error while sending request:', error);
        showNotification('Lỗi khi lưu sản phẩm', 'error');
    }
}

// Xóa sản phẩm
async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
        const response = await fetch(`/admin/api/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        showNotification('Xóa sản phẩm thành công', 'success');
        loadProducts(currentPage, currentFilters);
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Lỗi khi xóa sản phẩm', 'error');
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Quản lý menu
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`.menu-item a[onclick="showSection('${sectionId}')"]`);
    if (activeMenuItem) {
        activeMenuItem.parentElement.classList.add('active');
    }
    
    switch(sectionId) {
        case 'product-info':
            loadOverview();
            break;
        case 'add-product':
            loadProducts();
            loadFilters();
            break;
        case 'donhang':
            loadOrderStatuses().then(() => loadOrders());
            break;
        case 'user':
            loadUsers();
            break;
        case 'list-info':
            loadOverview();
            loadOrderHistory();
            break;
        case 'voucher-management':
            loadVouchers();
            break;
        case 'comment':
            loadComments();
            break;
    }
}

// Tải dữ liệu tổng quan
async function loadOverview() {
    try {
        const response = await fetch('/admin/api/overview', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 403) {
            window.location.href = '/login';
            return;
        }
        
        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {}
            console.error('loadOverview: Response not ok', { status: response.status, statusText: response.statusText, body: errorText });
            showNotification('Lỗi khi tải dữ liệu tổng quan', 'error');
            return;
        }
        
        const data = await response.json();
        updateOverview(data);
    } catch (error) {
        console.error('Error loading overview:', error);
        showNotification(error.message || 'Lỗi khi tải dữ liệu tổng quan', 'error');
        document.getElementById('total-products').textContent = '0';
        document.getElementById('total-customers').textContent = '0';
        document.getElementById('pending-orders').textContent = '0';
        document.getElementById('completed-orders').textContent = '0';
        document.getElementById('total-revenue').textContent = formatPrice(0);
    }
}

// Tải bộ lọc (thương hiệu và danh mục)
async function loadFilters() {
    try {
        const brandsResponse = await fetch('/admin/api/brands', {
            credentials: 'include'
        });
        
        if (!brandsResponse.ok) {
            throw new Error('Failed to fetch brands');
        }
        
        const brands = await brandsResponse.json();
        
        const brandSelects = document.querySelectorAll('select[id*="brand"]');
        brandSelects.forEach(select => {
            select.innerHTML = '<option value="">Chọn thương hiệu</option>' +
                brands.map(brand => `<option value="${brand.brand_id}">${brand.name}</option>`).join('');
        });
        
        const categoriesResponse = await fetch('/admin/api/categories', {
            credentials: 'include'
        });
        
        if (!categoriesResponse.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        const categories = await categoriesResponse.json();
        
        const categorySelects = document.querySelectorAll('select[id*="category"]');
        categorySelects.forEach(select => {
            if (select.id === 'filter-category') {
                select.innerHTML = '<option value="">Tất cả danh mục</option>' +
                    categories.map(category => `<option value="${category.category_id}">${category.name}</option>`).join('');
            }
        });

        const categoriesContainer = document.getElementById('product-categories-container');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = categories.map(category => `
                <label>
                    <input type="checkbox" name="product-categories" value="${category.category_id}">
                    ${category.name}
                </label>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading filters:', error);
        showNotification('Lỗi khi tải dữ liệu bộ lọc', 'error');
    }
}

// Load order statuses
async function loadOrderStatuses() {
    try {
        const response = await fetch('/admin/api/order-statuses', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách trạng thái');
        }
        
        orderStatuses = await response.json();
    } catch (error) {
        console.error('Lỗi khi tải danh sách trạng thái:', error);
        showNotification('Lỗi khi tải danh sách trạng thái', 'error');
    }
}

// Update order status
async function updateOrderStatus(orderId, statusId) {
    try {
        const response = await fetch(`/admin/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ status_id: statusId })
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật trạng thái đơn hàng');
        }

        showNotification('Cập nhật trạng thái đơn hàng thành công', 'success');
        loadOrders();
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        showNotification('Lỗi khi cập nhật trạng thái đơn hàng', 'error');
    }
}

// Function to load and display orders
async function loadOrders(filters = {}) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) {
        console.error('Không tìm thấy element ordersList');
        return;
    }

    try {
        // Không phân trang: không truyền limit/offset
        const queryParams = new URLSearchParams({
            ...filters
        });

        console.log(`[loadOrders] Requesting all orders, filters:`, filters);

        const response = await fetch(`/admin/api/orders?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log('[loadOrders] Server response:', data);

        if (!data || !Array.isArray(data.orders) || typeof data.total !== 'number') {
            throw new Error('Dữ liệu trả về từ server không hợp lệ');
        }

        const orders = data.orders;

        if (orders.length === 0) {
            ordersList.innerHTML = '<tr><td colspan="8" class="no-orders">Không có đơn hàng nào</td></tr>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.username || 'N/A'}</td>
                <td>${order.full_address || 'N/A'}</td>
                <td>${order.payment_method_name || 'N/A'}</td>
                <td>${order.status}</td>
                <td>${order.final_amount.toLocaleString('vi-VN')} VND</td>
                <td>${order.created_at}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="showOrderDetails(${order.order_id})">Chi tiết</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrder(${order.order_id})">Xóa</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('[loadOrders] Error:', error);
        ordersList.innerHTML = `<tr><td colspan="8" class="no-orders text-danger">${error.message}</td></tr>`;
        showNotification(error.message, 'error');
    }
}

// Helper function to get status color
function getStatusColor(statusId) {
    const colors = {
        1: '#fff3cd', // Chờ xác nhận
        2: '#cce5ff', // Đã xác nhận
        3: '#d4edda', // Đang giao hàng
        4: '#d1e7dd', // Đã giao hàng
        5: '#f8d7da'  // Đã hủy
    };
    return colors[statusId] || '#f8f9fa';
}

// Helper function to get status text color
function getStatusTextColor(statusId) {
    const colors = {
        1: '#856404', // Chờ xác nhận
        2: '#004085', // Đã xác nhận
        3: '#155724', // Đang giao hàng
        4: '#0f5132', // Đã giao hàng
        5: '#721c24'  // Đã hủy
    };
    return colors[statusId] || '#333';
}

// Function to view order details
async function viewOrder(orderId) {
    try {
        const response = await fetch(`/admin/api/orders/${orderId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Không lấy được chi tiết đơn hàng');
        const order = await response.json();

        let html = `
            <div>
                <div><strong>Mã đơn hàng:</strong> #${order.order_id}</div>
                <div><strong>Người nhận:</strong> ${order.receiver_name || 'Không xác định'}</div>
                <div><strong>Số điện thoại:</strong> ${order.receiver_phone || 'Không xác định'}</div>
                <div><strong>Địa chỉ:</strong> ${order.full_address || 'Không xác định'}</div>
                <div><strong>Phương thức thanh toán:</strong> ${order.payment_method_name || 'Không xác định'}</div>
                <div><strong>Trạng thái:</strong> ${order.status || 'Không xác định'}</div>
                <div><strong>Thành tiền:</strong> ${formatPrice(order.final_amount || 0)}</div>
                <div><strong>Phí vận chuyển:</strong> ${formatPrice(order.shipping_fee || 0)}</div>
                <div><strong>Giảm giá:</strong> ${formatPrice(order.discount_amount || 0)}</div>
                <div><strong>Tổng tiền:</strong> ${formatPrice(order.total_amount || 0)}</div>
                <div><strong>Ghi chú:</strong> ${order.note || 'Không có ghi chú'}</div>
                <div><strong>Ngày tạo:</strong> ${new Date(order.created_at).toLocaleString('vi-VN')}</div>
                <h4 style="margin-top: 16px;">Sản phẩm:</h4>
                <table class="order-details-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 8px; text-align: left;">Sản phẩm</th>
                            <th style="padding: 8px; text-align: left;">Số lượng</th>
                            <th style="padding: 8px; text-align: left;">Giá</th>
                            <th style="padding: 8px; text-align: left;">Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td style="padding: 8px;">
                                    <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.product_name || 'Sản phẩm'}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                                    ${item.product_name || 'Sản phẩm'}
                                </td>
                                <td style="padding: 8px;">${item.quantity || 0}</td>
                                <td style="padding: 8px;">${formatPrice(item.price || 0)}</td>
                                <td style="padding: 8px;">${formatPrice((item.quantity || 0) * (item.price || 0))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 24px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn-delete" onclick="deleteOrder(${order.order_id}); hideOrderDetail();">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        `;
        document.getElementById('order-detail-content').innerHTML = html;
        document.getElementById('order-detail-modal').style.display = 'block';
    } catch (err) {
        showNotification('Lỗi khi lấy chi tiết đơn hàng', 'error');
    }
}

// Function to hide order detail modal
function hideOrderDetail() {
    document.getElementById('order-detail-modal').style.display = 'none';
    document.getElementById('order-detail-content').innerHTML = '';
}

// Function to delete an order
async function deleteOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;

    try {
        const response = await fetch(`/admin/api/orders/${orderId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Lỗi khi xóa đơn hàng');

        showNotification('Xóa đơn hàng thành công', 'success');
        loadOrders();
    } catch (error) {
        console.error(error);
        showNotification('Lỗi khi xóa đơn hàng', 'error');
    }
}

// Hiển thị chi tiết sản phẩm
async function showProductDetail(productId) {
    try {
        const response = await fetch(`/admin/api/products/${productId}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Không lấy được chi tiết sản phẩm');
        const data = await response.json();

        let html = `
            <div style="display:flex;gap:20px;flex-wrap:wrap;">
                <div style="min-width:120px;max-width:120px;">
                    <img src="${data.product.image_url || '/img/no-image.png'}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;">
                </div>
                <div style="flex:1;min-width:200px;">
                    <h4>${data.product.name}</h4>
                    <p><b>Giá:</b> ${formatPrice(data.product.price)}</p>
                    <p><b>Giảm giá:</b> ${data.product.discount || 0}%</p>
                    <p><b>Tồn kho:</b> ${data.product.stock_quantity}</p>
                    <hr>
                    <h5>Thông số kỹ thuật:</h5>
                    <ul>
                        <li>Đường kính: ${data.details.diameter}</li>
                        <li>Độ chống nước: ${data.details.water_resistance_level}</li>
                        <li>Độ dày: ${data.details.thickness}</li>
                        <li>Mặt kính: ${data.details.material_face}</li>
                        <li>Vỏ: ${data.details.material_case}</li>
                        <li>Dây: ${data.details.material_strap}</li>
                        <li>Kích thước: ${data.details.size}</li>
                        <li>Bộ máy: ${data.details.movement}</li>
                        <li>Xuất xứ: ${data.details.origin}</li>
                        <li>Bảo hành: ${data.details.warranty}</li>
                    </ul>
                </div>
            </div>
            <div style="margin-top:18px;display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-start;align-items:center;">
                ${data.images && data.images.length > 0
                  ? data.images.map(img => {
                      const cleanImg = img.startsWith('img/') ? img.slice(4) : img;
                      return `<img src="/img/${cleanImg}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;">`;
                    }).join('')
                  : ''}
            </div>
            <div style="margin-top:24px;display:flex;gap:10px;justify-content:flex-end;">
                <button class="btn-edit" onclick="editProduct(${data.product.product_id}); hideProductDetail();">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn-delete" onclick="deleteProductFromDetail(${data.product.product_id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        `;
        document.getElementById('product-detail-content').innerHTML = html;
        document.getElementById('product-detail-modal').style.display = 'block';
    } catch (err) {
        showNotification('Lỗi khi lấy chi tiết sản phẩm', 'error');
    }
}

function hideProductDetail() {
    document.getElementById('product-detail-modal').style.display = 'none';
    document.getElementById('product-detail-content').innerHTML = '';
}

function deleteProductFromDetail(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    fetch(`/admin/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Lỗi khi xóa sản phẩm');
        showNotification('Xóa sản phẩm thành công', 'success');
        hideProductDetail();
        loadProducts(currentPage, currentFilters);
    })
    .catch(err => {
        showNotification('Lỗi khi xóa sản phẩm', 'error');
    });
}

// Hiển thị modal doanh thu chi tiết
function showRevenueDetailModal() {
    document.getElementById('modal-today-revenue').textContent = document.getElementById('today-revenue')?.textContent || '0 VND';
    document.getElementById('modal-yesterday-revenue').textContent = document.getElementById('yesterday-revenue')?.textContent || '0 VND';
    document.getElementById('modal-week-revenue').textContent = document.getElementById('week-revenue')?.textContent || '0 VND';
    document.getElementById('modal-month-revenue').textContent = document.getElementById('month-revenue')?.textContent || '0 VND';
    document.getElementById('revenue-detail-modal').style.display = 'block';
}

function hideRevenueDetail() {
    document.getElementById('revenue-detail-modal').style.display = 'none';
}

// Hiển thị danh sách người dùng
async function loadUsers() {
    const userContainer = document.querySelector('.user-management');
    if (!userContainer) return;
    try {
        const response = await fetch('/admin/api/users', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Lỗi khi lấy danh sách người dùng');
        const data = await response.json();
        const users = data.users || [];
        if (!Array.isArray(users) || users.length === 0) {
            userContainer.innerHTML = '<div class="no-users">Không có tài khoản nào.</div>';
            renderAddUserButton();
            return;
        }
        const roleOptions = [
            { value: 'admin', label: 'Admin' },
            { value: 'customer', label: 'Khách hàng' }
        ];
        const statusOptions = [
            { value: 1, label: 'Hoạt động' },
            { value: 0, label: 'Khoá' }
        ];
        userContainer.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.user_id}</td>
                            <td>${u.username}</td>
                            <td>${u.email}</td>
                            <td>
                                <select onchange="updateUserRole(${u.user_id}, this.value)">
                                    ${roleOptions.map(opt => `<option value="${opt.value}" ${u.role === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                                </select>
                            </td>
                            <td>
                                <select onchange="updateUserStatus(${u.user_id}, this.value)">
                                    ${statusOptions.map(opt => `<option value="${opt.value}" ${u.isActive == opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                                </select>
                            </td>
                            <td>
                                <button class="btn-delete" onclick="deleteUser(${u.user_id})"><i class="fas fa-trash"></i> Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        renderAddUserButton();
    } catch (err) {
        userContainer.innerHTML = `<div class="no-users text-danger">${err.message}</div>`;
        renderAddUserButton();
    }
}

// Cập nhật vai trò người dùng
window.updateUserRole = async function(userId, newRole) {
    try {
        const res = await fetch(`/admin/api/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật vai trò');
        showNotification('Cập nhật vai trò thành công', 'success');
        loadUsers();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Cập nhật trạng thái người dùng
window.updateUserStatus = async function(userId, newStatus) {
    try {
        const res = await fetch(`/admin/api/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: parseInt(newStatus) })
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật trạng thái');
        showNotification('Cập nhật trạng thái thành công', 'success');
        loadUsers();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Hiển thị modal thêm người dùng
window.showAddUserModal = function() {
    let modal = document.getElementById('add-user-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-user-modal';
        modal.className = 'form-container';
        modal.innerHTML = `
            <div class="form-content" style="max-width:400px;">
                <div class="form-header">
                    <h3>Thêm Người Dùng</h3>
                    <button type="button" class="close-form" onclick="hideAddUserModal()"><i class="fas fa-times"></i></button>
                </div>
                <form id="add-user-form">
                    <div class="form-group">
                        <label>Tên đăng nhập:</label>
                        <input type="text" name="username" required>
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Mật khẩu:</label>
                        <input type="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label>Vai trò:</label>
                        <select name="role">
                            <option value="customer">Khách hàng</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Trạng thái:</label>
                        <select name="isActive">
                            <option value="1">Hoạt động</option>
                            <option value="0">Khoá</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Thêm</button>
                        <button type="button" class="btn-secondary" onclick="hideAddUserModal()">Hủy</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('add-user-form').onsubmit = handleAddUserSubmit;
    }
    modal.style.display = 'block';
}

window.hideAddUserModal = function() {
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.style.display = 'none';
}

async function handleAddUserSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        role: form.role.value,
        isActive: parseInt(form.isActive.value)
    };
    if (!data.username || !data.email || !data.password) {
        showNotification('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    try {
        const res = await fetch('/admin/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Lỗi khi thêm người dùng');
        }
        showNotification('Thêm người dùng thành công', 'success');
        hideAddUserModal();
        loadUsers();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Thêm nút Thêm người dùng
function renderAddUserButton() {
    const userContainer = document.querySelector('.user-management');
    if (!userContainer) return;
    let btn = document.getElementById('add-user-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'add-user-btn';
        btn.className = 'btn-primary';
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Thêm người dùng';
        btn.style.marginBottom = '12px';
        btn.onclick = showAddUserModal;
        userContainer.prepend(btn);
    }
}

// Xóa người dùng
window.deleteUser = async function(userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
        const res = await fetch(`/admin/api/users/${userId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Lỗi khi xóa người dùng');
        showNotification('Xóa người dùng thành công', 'success');
        loadUsers();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Hiển thị danh sách voucher
async function loadVouchers() {
    const voucherList = document.getElementById('voucher-list');
    if (!voucherList) return;
    const voucherContainer = document.querySelector('.voucher-list-container');
    let btn = document.getElementById('add-voucher-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'add-voucher-btn';
        btn.className = 'btn-primary';
        btn.innerHTML = '<i class="fas fa-plus"></i> Thêm voucher';
        btn.style.marginBottom = '12px';
        btn.onclick = () => showVoucherModal();
        voucherContainer.prepend(btn);
    }
    try {
        const response = await fetch('/admin/api/vouchers', { credentials: 'include' });
        if (!response.ok) throw new Error('Lỗi khi lấy danh sách voucher');
        const vouchers = await response.json();
        if (!vouchers || vouchers.length === 0) {
            voucherList.innerHTML = '<tr><td colspan="7" class="text-center">Không có voucher nào</td></tr>';
            return;
        }
        voucherList.innerHTML = vouchers.map(v => `
            <tr>
                <td>${v.code}</td>
                <td>${v.discount_amount}</td>
                <td>${v.min_order_value}</td>
                <td>${v.start_date ? v.start_date.slice(0,10) : ''}</td>
                <td>${v.end_date ? v.end_date.slice(0,10) : ''}</td>
                <td>${v.usage_limit ?? ''}</td>
                <td>
                    <button class="btn-edit" onclick='showVoucherModal(${JSON.stringify(v)})'><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn-delete" onclick="deleteVoucher(${v.voucher_id})"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        voucherList.innerHTML = `<tr><td colspan="7" class="text-danger">${err.message}</td></tr>`;
    }
}

// Hiển thị modal thêm/sửa voucher
window.showVoucherModal = function(voucher = null) {
    let modal = document.getElementById('voucher-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'voucher-modal';
        modal.className = 'form-container';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="form-content" style="max-width:420px;">
            <div class="form-header">
                <h3>${voucher ? 'Sửa' : 'Thêm'} Voucher</h3>
                <button type="button" class="close-form" onclick="hideVoucherModal()"><i class="fas fa-times"></i></button>
            </div>
            <form id="voucher-form">
                <input type="hidden" name="voucher_id" value="${voucher ? voucher.voucher_id : ''}">
                <div class="form-group">
                    <label>Mã voucher:</label>
                    <input type="text" name="code" value="${voucher ? voucher.code : ''}" required>
                </div>
                <div class="form-group">
                    <label>Giá trị giảm (VNĐ):</label>
                    <input type="number" name="discount_amount" value="${voucher ? voucher.discount_amount : ''}" required>
                </div>
                <div class="form-group">
                    <label>Giá trị đơn hàng tối thiểu:</label>
                    <input type="number" name="min_order_value" value="${voucher ? voucher.min_order_value : ''}" required>
                </div>
                <div class="form-group">
                    <label>Ngày bắt đầu:</label>
                    <input type="date" name="start_date" value="${voucher && voucher.start_date ? voucher.start_date.slice(0,10) : ''}">
                </div>
                <div class="form-group">
                    <label>Ngày kết thúc:</label>
                    <input type="date" name="end_date" value="${voucher && voucher.end_date ? voucher.end_date.slice(0,10) : ''}">
                </div>
                <div class="form-group">
                    <label>Số lượt sử dụng:</label>
                    <input type="number" name="usage_limit" value="${voucher ? (voucher.usage_limit ?? '') : ''}">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${voucher ? 'Cập nhật' : 'Thêm'}</button>
                    <button type="button" class="btn-secondary" onclick="hideVoucherModal()">Hủy</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('voucher-form').onsubmit = handleVoucherSubmit;
    modal.style.display = 'flex';
}

window.hideVoucherModal = function() {
    const modal = document.getElementById('voucher-modal');
    if (modal) modal.style.display = 'none';
}

async function handleVoucherSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const voucher_id = form.voucher_id.value;
    const data = {
        code: form.code.value.trim(),
        discount_amount: parseFloat(form.discount_amount.value),
        min_order_value: parseFloat(form.min_order_value.value),
        start_date: form.start_date.value || null,
        end_date: form.end_date.value || null,
        usage_limit: form.usage_limit.value ? parseInt(form.usage_limit.value) : null
    };
    if (!data.code || isNaN(data.discount_amount) || isNaN(data.min_order_value)) {
        showNotification('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    try {
        const url = voucher_id ? `/admin/api/vouchers/${voucher_id}` : '/admin/api/vouchers';
        const method = voucher_id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Lỗi khi lưu voucher');
        }
        showNotification(voucher_id ? 'Cập nhật voucher thành công' : 'Thêm voucher thành công', 'success');
        hideVoucherModal();
        loadVouchers();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

window.deleteVoucher = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;
    try {
        const res = await fetch(`/admin/api/vouchers/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa voucher');
        showNotification('Xóa voucher thành công', 'success');
        loadVouchers();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Hiển thị danh sách đánh giá
const commentTableBody = document.getElementById('comment-table-body');

async function loadComments() {
    try {
        const response = await fetch('/admin/api/comments');
        if (!response.ok) {
            throw new Error('Lỗi khi tải danh sách đánh giá');
        }

        const comments = await response.json();

        commentTableBody.innerHTML = comments.map(comment => `
            <tr>
                <td>${comment.comment_id}</td>
                <td>${comment.content}</td>
                <td>${comment.rating}</td>
                <td>${comment.username}</td>
                <td>${comment.product_name}</td>
                <td>${new Date(comment.created_at).toLocaleString('vi-VN')}</td>
                <td>
                    <button class="btn-delete" onclick="deleteComment(${comment.comment_id})">Xóa</button>
                    <button class="btn-hide" onclick="hideComment(${comment.comment_id})">Ẩn</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Xóa đánh giá
async function deleteComment(commentId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;

    try {
        const response = await fetch(`/admin/api/comments/${commentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Lỗi khi xóa đánh giá');
        }

        showNotification('Xóa đánh giá thành công', 'success');
        loadComments();
    } catch (error) {
        console.error('Error deleting comment:', error);
        showNotification('Không thể xóa đánh giá', 'error');
    }
}

// Ẩn đánh giá
async function hideComment(commentId) {
    if (!confirm('Bạn có chắc chắn muốn ẩn đánh giá này?')) return;

    try {
        const response = await fetch(`/admin/api/comments/${commentId}/hide`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Lỗi khi ẩn đánh giá');
        }

        showNotification('Ẩn đánh giá thành công', 'success');
        loadComments();
    } catch (error) {
        console.error('Error hiding comment:', error);
        showNotification('Không thể ẩn đánh giá', 'error');
    }
}

// Hiển thị lịch sử đơn hàng đã hoàn thành
async function loadOrderHistory() {
    const historyList = document.getElementById('order-history-list');
    if (!historyList) return;
    try {
        const response = await fetch('/admin/api/orders?status=completed', { credentials: 'include' });
        if (!response.ok) throw new Error('Lỗi khi lấy lịch sử đơn hàng');
        const orders = await response.json();
        if (!orders || orders.length === 0) {
            historyList.innerHTML = '<tr><td colspan="6" class="text-center">Không có đơn hàng hoàn thành</td></tr>';
            return;
        }
        historyList.innerHTML = orders.map(order => `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.username || 'N/A'}</td>
                <td>${order.full_address || 'N/A'}</td>
                <td>${order.payment_method_name || 'N/A'}</td>
                <td>${formatPrice(order.final_amount)}</td>
                <td>${order.created_at}</td>
            </tr>
        `).join('');
    } catch (err) {
        historyList.innerHTML = `<tr><td colspan="6" class="text-danger">${err.message}</td></tr>`;
    }
}

function renderListInfo(categories, brands, paymentMethods) {
    const categoryList = document.getElementById('category-list');
    if (categoryList) {
        if (categories && categories.length > 0) {
            categoryList.innerHTML = categories.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>
                        <button class="btn-edit" onclick="showCategoryModal(${c.category_id}, '${c.name.replace(/'/g, "\\'")}')"><i class='fas fa-edit'></i></button>
                        <button class="btn-delete" onclick="deleteCategory(${c.category_id})"><i class='fas fa-trash'></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            categoryList.innerHTML = '<tr><td colspan="2">Không có danh mục nào.</td></tr>';
        }
    }
    const brandList = document.getElementById('brand-list');
    if (brandList) {
        if (brands && brands.length > 0) {
            brandList.innerHTML = brands.map(b => `
                <tr>
                    <td>${b.name}</td>
                    <td>
                        <button class="btn-edit" onclick="showBrandModal(${b.brand_id}, '${b.name.replace(/'/g, "\\'")}')"><i class='fas fa-edit'></i></button>
                        <button class="btn-delete" onclick="deleteBrand(${b.brand_id})"><i class='fas fa-trash'></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            brandList.innerHTML = '<tr><td colspan="2">Không có thương hiệu nào.</td></tr>';
        }
    }
    const paymentList = document.getElementById('payment-method-list');
    if (paymentList) {
        if (paymentMethods && paymentMethods.length > 0) {
            paymentList.innerHTML = paymentMethods.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>
                        <button class="btn-edit" onclick="showPaymentModal(${p.payment_method_id}, '${p.name.replace(/'/g, "\\'")}')"><i class='fas fa-edit'></i></button>
                        <button class="btn-delete" onclick="deletePaymentMethod(${p.payment_method_id})"><i class='fas fa-trash'></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            paymentList.innerHTML = '<tr><td colspan="2">Không có phương thức nào.</td></tr>';
        }
    }
}

// Modal Danh mục
window.showCategoryModal = function(id = '', name = '') {
    document.getElementById('category-modal-id').value = id || '';
    document.getElementById('category-modal-name').value = name || '';
    document.getElementById('category-modal-title').textContent = id ? 'Sửa Danh Mục' : 'Thêm Danh Mục';
    document.getElementById('category-modal').style.display = 'block';
}

window.hideCategoryModal = function() {
    document.getElementById('category-modal').style.display = 'none';
}

document.getElementById('add-category-btn2').onclick = () => showCategoryModal();

document.getElementById('category-modal-form').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('category-modal-id').value;
    const name = document.getElementById('category-modal-name').value.trim();
    if (!name) return showNotification('Tên danh mục không được để trống', 'error');
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/admin/api/categories/${id}` : '/admin/api/categories';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Lỗi khi lưu danh mục');
        showNotification(id ? 'Cập nhật thành công' : 'Thêm thành công', 'success');
        hideCategoryModal();
        loadOverview();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

window.deleteCategory = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
        const res = await fetch(`/admin/api/categories/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa danh mục');
        showNotification('Xóa thành công', 'success');
        loadOverview();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Modal Thương hiệu
window.showBrandModal = function(id = '', name = '') {
    document.getElementById('brand-modal-id').value = id || '';
    document.getElementById('brand-modal-name').value = name || '';
    document.getElementById('brand-modal-title').textContent = id ? 'Sửa Thương Hiệu' : 'Thêm Thương Hiệu';
    document.getElementById('brand-modal').style.display = 'block';
}

window.hideBrandModal = function() {
    document.getElementById('brand-modal').style.display = 'none';
}

document.getElementById('add-brand-btn2').onclick = () => showBrandModal();

document.getElementById('brand-modal-form').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('brand-modal-id').value;
    const name = document.getElementById('brand-modal-name').value.trim();
    if (!name) return showNotification('Tên thương hiệu không được để trống', 'error');
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/admin/api/brands/${id}` : '/admin/api/brands';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Lỗi khi lưu thương hiệu');
        showNotification(id ? 'Cập nhật thành công' : 'Thêm thành công', 'success');
        hideBrandModal();
        loadOverview();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

window.deleteBrand = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;
    try {
        const res = await fetch(`/admin/api/brands/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa thương hiệu');
        showNotification('Xóa thành công', 'success');
        loadOverview();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// Modal Phương thức thanh toán
window.showPaymentModal = function(id = '', name = '') {
    document.getElementById('payment-modal-id').value = id || '';
    document.getElementById('payment-modal-name').value = name || '';
    document.getElementById('payment-modal-title').textContent = id ? 'Sửa Phương Thức' : 'Thêm Phương Thức';
    document.getElementById('payment-modal').style.display = 'block';
}

window.hidePaymentModal = function() {
    document.getElementById('payment-modal').style.display = 'none';
}

document.getElementById('add-payment-btn').onclick = () => showPaymentModal();

document.getElementById('payment-modal-form').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('payment-modal-id').value;
    const name = document.getElementById('payment-modal-name').value.trim();
    if (!name) return showNotification('Tên phương thức không được để trống', 'error');
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/admin/api/payment-methods/${id}` : '/admin/api/payment-methods';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Lỗi khi lưu phương thức');
        showNotification(id ? 'Cập nhật thành công' : 'Thêm thành công', 'success');
        hidePaymentModal();
        loadOverview();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

window.deletePaymentMethod = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa phương thức này?')) return;
    try {
        const res = await fetch(`/admin/api/payment-methods/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa phương thức');
        showNotification('Xóa thành công', 'success');
        loadOverview();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// --- FILTER FOR ORDER MANAGEMENT ---
async function renderOrderPaymentFilter() {
    const paymentSelect = document.getElementById('order-payment-filter');
    if (!paymentSelect) return;
    try {
        const res = await fetch('/admin/api/payment-methods', { credentials: 'include' });
        if (!res.ok) return;
        const methods = await res.json();
        paymentSelect.innerHTML = '<option value="all">Tất cả</option>';
        methods.forEach(pm => {
            const opt = document.createElement('option');
            opt.value = pm.payment_method_id || pm.payment_methods_id || pm.id || pm.name;
            opt.textContent = pm.name;
            paymentSelect.appendChild(opt);
        });
    } catch {}
}

function getOrderFiltersFromUI() {
    const filters = {};
    const statusFilter = document.getElementById('order-status-filter');
    const orderSortFilter = document.getElementById('order-sort-filter');
    const paymentFilter = document.getElementById('order-payment-filter');
    if (statusFilter && statusFilter.value && statusFilter.value !== 'all') filters.status_id = statusFilter.value;
    if (paymentFilter && paymentFilter.value && paymentFilter.value !== 'all') filters.payment_method_id = paymentFilter.value;
    if (orderSortFilter && orderSortFilter.value) filters.sortBy = orderSortFilter.value;
    return filters;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    showSection('product-info');
    
    document.querySelectorAll('.menu-item a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        });
    });
    
    document.getElementById('add-product-btn')?.addEventListener('click', () => showProductForm());
    document.getElementById('product-form-content')?.addEventListener('submit', handleProductSubmit);
    
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadProducts(currentPage, currentFilters);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadProducts(currentPage, currentFilters);
    });
    
    const searchInput = document.getElementById('search-product');
    const brandFilter = document.getElementById('filter-brand');
    const categoryFilter = document.getElementById('filter-category');
    const sortFilter = document.getElementById('filter-sort');
    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            loadProducts(currentPage, currentFilters);
        }, 500);
    });
    
    brandFilter.addEventListener('change', (e) => {
        currentFilters.brandId = e.target.value;
        currentPage = 1;
        loadProducts(currentPage, currentFilters);
    });
    
    categoryFilter.addEventListener('change', (e) => {
        currentFilters.categoryId = e.target.value;
        currentPage = 1;
        loadProducts(currentPage, currentFilters);
    });
    
    sortFilter.addEventListener('change', (e) => {
        currentFilters.sortBy = e.target.value;
        currentPage = 1;
        loadProducts(currentPage, currentFilters);
    });

    const detailModal = document.getElementById('product-detail-modal');
    detailModal.addEventListener('click', function(e) {
        if (e.target === detailModal) hideProductDetail();
    });

    const orderDetailModal = document.getElementById('order-detail-modal');
    if (orderDetailModal) {
        orderDetailModal.addEventListener('click', function(e) {
            if (e.target === orderDetailModal) hideOrderDetail();
        });
    }

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideProductDetail();
            hideOrderDetail();
        }
    });

    const revenueDetailModal = document.getElementById('revenue-detail-modal');
    if (revenueDetailModal) {
        revenueDetailModal.addEventListener('click', function(e) {
            if (e.target === this) hideRevenueDetail();
        });
    }

    document.getElementById('total-revenue')?.addEventListener('click', showRevenueDetailModal);
    document.getElementById('show-revenue-detail')?.addEventListener('click', showRevenueDetailModal);

    renderOrderStatusFilter();
    renderOrderPaymentFilter();
    // Thêm sự kiện cho filter đơn hàng
    const statusFilter = document.getElementById('order-status-filter');
    const orderSortFilter = document.getElementById('order-sort-filter');
    const paymentFilter = document.getElementById('order-payment-filter');
    const filterBtn = document.getElementById('order-filter-btn');
    [statusFilter, orderSortFilter, paymentFilter].forEach(el => {
        if (el) el.addEventListener('change', () => {
            loadOrders(getOrderFiltersFromUI());
        });
    });
    if (filterBtn) filterBtn.addEventListener('click', () => {
        loadOrders(getOrderFiltersFromUI());
    });

    // Khi chuyển sang section donhang, ẩn phân trang đơn hàng
    const donhangSection = document.getElementById('donhang');
    const orderPagination = document.getElementById('order-pagination');
    if (donhangSection && orderPagination) {
        const observer = new MutationObserver(() => {
            if (donhangSection.style.display !== 'none') {
                orderPagination.style.display = 'none';
            }
        });
        observer.observe(donhangSection, { attributes: true, attributeFilter: ['style'] });
    }
});

// Hiển thị chi tiết đơn hàng cho admin
window.showOrderDetails = async function(orderId) {
    try {
        // Đảm bảo đã có danh sách trạng thái
        if (!orderStatuses || orderStatuses.length === 0) {
            await loadOrderStatuses();
        }
        const res = await fetch(`/admin/api/orders/${orderId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Không lấy được chi tiết đơn hàng');
        const order = await res.json();
        let statusOptions = orderStatuses.map(st => `
            <option value="${st.order_status_id}" ${st.order_status_id === order.status_id ? 'selected' : ''}>${st.status}</option>
        `).join('');
        let html = `
            <div><strong>Mã đơn hàng:</strong> #${order.order_id}</div>
            <div><strong>Khách hàng:</strong> ${order.username || 'N/A'} (${order.email || ''})</div>
            <div><strong>Người nhận:</strong> ${order.receiver_name || 'Không xác định'}</div>
            <div><strong>Số điện thoại:</strong> ${order.receiver_phone || 'Không xác định'}</div>
            <div><strong>Địa chỉ:</strong> ${order.full_address || 'Không xác định'}</div>
            <div><strong>Phương thức thanh toán:</strong> ${order.payment_method_name || 'Không xác định'}</div>
            <div><strong>Trạng thái:</strong> 
                <select id="order-status-select" style="margin-left:8px;">
                    ${statusOptions}
                </select>
                <button id="save-order-status-btn" class="btn-primary" style="margin-left:8px;">Lưu</button>
            </div>
            <div><strong>Thành tiền:</strong> ${formatPrice(order.final_amount || 0)}</div>
            <div><strong>Phí vận chuyển:</strong> ${formatPrice(order.shipping_fee || 0)}</div>
            <div><strong>Giảm giá:</strong> ${formatPrice(order.discount_amount || 0)}</div>
            <div><strong>Tổng tiền:</strong> ${formatPrice(order.total_amount || 0)}</div>
            <div><strong>Ghi chú:</strong> ${order.note || 'Không có ghi chú'}</div>
            <div><strong>Ngày tạo:</strong> ${new Date(order.created_at).toLocaleString('vi-VN')}</div>
            <h4 style="margin-top: 16px;">Sản phẩm:</h4>
            <table class="order-details-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 8px; text-align: left;">Sản phẩm</th>
                        <th style="padding: 8px; text-align: left;">Số lượng</th>
                        <th style="padding: 8px; text-align: left;">Giá</th>
                        <th style="padding: 8px; text-align: left;">Tổng</th>
                    </tr>
                </thead>
                <tbody>
                    ${(order.items || []).map(item => `
                        <tr>
                            <td style="padding: 8px;">
                                <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.product_name || 'Sản phẩm'}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                                ${item.product_name || 'Sản phẩm'}
                            </td>
                            <td style="padding: 8px;">${item.quantity || 0}</td>
                            <td style="padding: 8px;">${formatPrice(item.price || 0)}</td>
                            <td style="padding: 8px;">${formatPrice((item.quantity || 0) * (item.price || 0))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('order-detail-content').innerHTML = html;
        document.getElementById('order-detail-modal').style.display = 'block';
        // Gán sự kiện lưu trạng thái
        document.getElementById('save-order-status-btn').onclick = async function() {
            const newStatusId = document.getElementById('order-status-select').value;
            if (parseInt(newStatusId) === order.status_id) {
                showNotification('Trạng thái không thay đổi', 'info');
                return;
            }
            await updateOrderStatus(order.order_id, parseInt(newStatusId));
            // Sau khi cập nhật, reload lại chi tiết đơn hàng
            showOrderDetails(order.order_id);
            loadOrders();
        };
    } catch (err) {
        showNotification('Lỗi khi lấy chi tiết đơn hàng', 'error');
    }
}

async function renderOrderStatusFilter() {
    const statusSelect = document.getElementById('order-status-filter');
    if (!statusSelect) return;
    try {
        const res = await fetch('/admin/api/order-statuses', { credentials: 'include' });
        if (!res.ok) return;
        const statuses = await res.json();
        statusSelect.innerHTML = '<option value="all">Tất cả</option>';
        statuses.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st.order_status_id;
            opt.textContent = st.status;
            statusSelect.appendChild(opt);
        });
    } catch {}
}