// File: public/js/main.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM đã tải xong, bắt đầu gán sự kiện...");
    
    // Kiểm tra trạng thái người dùng
    checkUserStatus().then(user => {
        updateFooter(user);
    });

    // Gắn sự kiện cho nút prev/next (nếu tồn tại trên trang)
    const prevBtn = document.querySelector('.prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentReviewIndex = (currentReviewIndex - reviewsPerPage + totalReviews) % totalReviews;
            showReviews(currentReviewIndex);
        });
    } else {
        console.warn("Không tìm thấy .prev-btn trong DOM");
    }

    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentReviewIndex = (currentReviewIndex + reviewsPerPage) % totalReviews;
            showReviews(currentReviewIndex);
        });
    } else {
        console.warn("Không tìm thấy .next-btn trong DOM");
    }

    if (document.querySelector('.review')) {
        showReviews(currentReviewIndex);
    }

    // Lấy danh sách brand
    fetch('/api/brands')
        .then(res => res.json())
        .then(brands => {
            const select = document.getElementById('searchBrand');
            if (select) {
                brands.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.brand_id;
                    opt.textContent = b.name;
                    select.appendChild(opt);
                });
            }
        });

    // Lấy danh sách category
    fetch('/api/categories')
        .then(res => res.json())
        .then(categories => {
            const select = document.getElementById('searchCategory');
            if (select) {
                categories.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.category_id;
                    opt.textContent = c.name;
                    select.appendChild(opt);
                });
            }
        });

    // Bắt sự kiện tìm kiếm
    document.getElementById('searchSubmit').addEventListener('click', function() {
        doSearch(getSearchParams());
    });
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doSearch(getSearchParams());
    });
    document.getElementById('searchBrand').addEventListener('change', function() {
        doSearch(getSearchParams());
    });
    document.getElementById('searchCategory').addEventListener('change', function() {
        doSearch(getSearchParams());
    });

    document.getElementById('filter-sort').addEventListener('change', function() {
        doSearch(getSearchParams());
    });
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include", // Đảm bảo cookie được gửi từ server
        });
        if (response.ok) {
            const user = await response.json();
            console.log("Response từ server:", user);

            // Không cần lưu token vào cookie nữa vì server đã làm
            alert("Đăng nhập thành công!");
            updateHeader(user);
            updateFooter(user);
            document.getElementById("authPopup").style.display = "none";
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Đăng nhập thất bại.");
        }
    } catch (error) {
        console.error("Lỗi kết nối server:", error);
        alert("Lỗi kết nối server.");
    }
});

async function checkUserStatus() {
    try {
        let response = await fetchWithAuth("/auth/status", { method: "GET" });
        console.log("Response từ /auth/status:", await response.clone().text());

        if (response.ok) {
            const user = await response.json();
            console.log("User từ server:", user);
            updateHeader(user);
            updateFooter(user);
            return user;
        } else if (response.status === 401) {
            console.log("Token không hợp lệ hoặc thiếu, thử làm mới...");
            let refreshResponse = await fetch("/auth/refreshToken", {
                method: "POST",
                credentials: "include",
            });
            console.log("Response từ /auth/refreshToken:", await refreshResponse.clone().text());

            if (refreshResponse.ok) {
                return checkUserStatus();
            } else {
                throw new Error("Refresh token failed or missing");
            }
        } else {
            throw new Error("Unexpected status: " + response.status);
        }
    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái:", error);
        removeCookies();
        updateHeader(null);
        updateFooter(null);
        return null;
    }
}

async function fetchWithAuth(url, options = {}) {
    // Không cần lấy token từ cookie thủ công vì server sẽ đọc từ req.cookies
    options.credentials = "include"; // Gửi cookie (authToken, refreshToken) kèm yêu cầu
    return fetch(url, options); // Thực hiện yêu cầu mà không thêm header Authorization
}

function updateHeader(user) {
    const nav = document.querySelector("header nav ul");
    if (user) {
        nav.innerHTML = `
            <li><a href="/">Trang chủ</a></li>
            <li><a href="#">Sản phẩm</a>
                <ul class="dropdown">
                    <li><a href="#1">Sản phẩm nổi bật</a></li>
                    <li><a href="#2">Đồng hồ nam</a></li>
                    <li><a href="#3">Đồng hồ nữ</a></li>
                </ul>
            </li>
            <li><a href="#">Liên hệ</a></li>
            <li><a href="#">Tài khoản</a>
                <ul class="dropdown">
                    ${user.role === "customer" ? ` 
                        <li><a href="/cart" class="cart-link">Giỏ hàng</a></li>
                        <li><a href="/account">Tài khoản</a></li>
                    ` : `
                        <li><a href="/admin">Quản trị hệ thống</a></li>
                    `}
                    <li><a href="#" onclick="logout(); return false;">Đăng xuất</a></li>
                </ul>
            </li>
        `;
    } else {
        nav.innerHTML = `
            <li><a href="#">Trang chủ</a></li>
            <li><a href="#">Sản phẩm</a>
                <ul class="dropdown">
                    <li><a href="#1">Sản phẩm nổi bật</a></li>
                    <li><a href="#2">Đồng hồ nam</a></li>
                    <li><a href="#3">Đồng hồ nữ</a></li>
                </ul>
            </li>
            <li><a href="#">Liên hệ</a></li>
            <li><a href="#" onclick="showLoginPopup(); return false;">Đăng nhập</a></li>
        `;
    }
}

document.querySelectorAll(".add-to-cart-form").forEach(form => {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const productId = this.dataset.productId;
        const data = {
            product_id: productId,
            quantity: 1
        };

        try {
            const response = await fetchWithAuth("/cart/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // Xóa "Authorization" vì server đọc từ cookie
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                alert("Đã thêm vào giỏ hàng thành công");
                window.location.href = "/"; 
            } else if (response.status === 401 && result.message === "Phiên đăng nhập đã hết hạn") {
                alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
                removeCookies();
                window.location.href = "/";
            } else {
                alert(result.message || "Không thể thêm vào giỏ hàng");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
        }
    });
});

async function logout() {
    try {
        const response = await fetchWithAuth("/auth/logout", {
            method: "POST",
        });
        if (response.ok) {
            const data = await response.json();
            alert(data.message); // "Đăng xuất thành công"
            updateHeader(null);  // Cập nhật UI trước
            updateFooter(null);
            // Không cần removeCookies() vì server đã xóa cookie
            window.location.href = "/"; // Reload sau khi cập nhật UI
        } else {
            const errorData = await response.text();
            console.error("Logout thất bại - Status:", response.status, "Response:", errorData);
            alert("Đăng xuất thất bại: " + errorData);
        }
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        alert("Có lỗi khi đăng xuất, vui lòng thử lại.");
    }
}

function updateFooter(user) {
    const footerLinks = document.getElementById("footer-links");
    if (!footerLinks) {
        console.error("Không tìm thấy phần tử danh sách trong footer.");
        return;
    }

    if (user) {
        footerLinks.innerHTML = `
            <li><a href="#" class="cart-link">Giỏ hàng</a></li>
            <li><a href="#" onclick="logout(); return false;">Đăng xuất</a></li>
        `;
        document.querySelector("#footer-links .cart-link").addEventListener("click", async (e) => {
            e.preventDefault();
            await loadCart();
        });
    } else {
        footerLinks.innerHTML = `
            <li><a href="/">Đăng nhập</a></li>
            <li><a href="/">Đăng ký</a></li>
        `;
    }
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function removeCookies() {
    document.cookie = "authToken=; path=/; HttpOnly; secure=false; max-age=0";
    document.cookie = "refreshToken=; path=/; HttpOnly; secure=false; max-age=0";
}


///////////////////////////////////////////////////
function attachCartEventListeners() {
    const prevBtn = document.querySelector('.prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentReviewIndex = (currentReviewIndex - reviewsPerPage + totalReviews) % totalReviews;
            showReviews(currentReviewIndex);
        });
    } else {
        console.error("Không tìm thấy phần tử .prev-btn trong DOM");
    }
}

document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());    
    console.log("Form data:", data); // Thêm dòng này để debug
    // Kiểm tra các trường bắt buộc
    if (!data.full_name || !data.username || !data.email || !data.password) {
        alert("Vui lòng điền đầy đủ thông tin (họ tên, tài khoản, email, mật khẩu)!");
        return;
    }

    // Kiểm tra password và confirmPassword khớp nhau
    if (data.password !== data.confirmPassword) {
        alert("Mật khẩu và xác nhận mật khẩu không khớp!");
        return;
    }

    // Chuẩn bị dữ liệu gửi đến backend (loại bỏ confirmPassword)
    const registerData = {
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        password: data.password,
    };

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registerData),
        });
        if (response.ok) {
            alert("Đăng ký thành công!");
            window.location.reload();
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
        }
    } catch (error) {
        alert("Lỗi kết nối server. Vui lòng thử lại sau!");
    }
});

// Hàm cập nhật footer sau khi đăng nhập hoặc đăng xuất
function updateFooter(user) {
    const footerLinks = document.getElementById("footer-links");

    if (!footerLinks) {
        console.error("Không tìm thấy phần tử danh sách trong footer.");
        return;
    }

    if (user) {
        // Nếu người dùng đã đăng nhập, hiển thị Giỏ hàng và Đăng xuất
        footerLinks.innerHTML = `
            <li><a href="/cart">Giỏ hàng</a></li>
            <li><a href="#" onclick="logout(); return false;">Đăng xuất</a></li>
        `;
    } else {
        // Nếu chưa đăng nhập, hiển thị Đăng nhập và Đăng ký
        footerLinks.innerHTML = `
            <li><a href="/">Đăng nhập</a></li>
            <li><a href="/">Đăng ký</a></li>
        `;
    }
}

// Hiển thị popup đăng nhập
function showLoginPopup() {
    const popup = document.getElementById("authPopup");
    if (popup) {
        popup.style.display = "block";
    }
}

// Đóng popup khi nhấn vào nút đóng
document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.querySelector(".close-btn");
    const popup = document.getElementById("authPopup");

    if (closeBtn && popup) {
        closeBtn.addEventListener("click", () => {
            popup.style.display = "none";
        });
    }

    // Đóng popup khi nhấn ra ngoài
    window.addEventListener("click", (event) => {
        if (event.target === popup) {
            popup.style.display = "none";
        }
    });
});

// Chuyển đổi giữa các tab
function openTab(tabId, event) {
    const tabs = document.querySelectorAll(".tab-content");
    const buttons = document.querySelectorAll(".tab-btn");

    tabs.forEach((tab) => tab.classList.remove("active"));
    buttons.forEach((button) => button.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    if (event) {
        event.target.classList.add("active");
    }
}

// Hiển thị tất cả sản phẩm
function showAllProducts(button) {
    const toggleButtons = button.closest(".toggle-buttons"); // Find the toggle-buttons div
    if (!toggleButtons) {
        console.error("Không tìm thấy .toggle-buttons");
        return;
    }

    const container = toggleButtons.previousElementSibling; // Assume the container is the previous sibling
    if (!container || !container.classList.contains("container")) {
        console.error("Không tìm thấy .container");
        return;
    }

    const productsContainer = container.querySelector(".products-carousel .products");
    if (!productsContainer) {
        console.error("Không tìm thấy .products bên trong .products-carousel");
        return;
    }

    productsContainer.classList.add("expand"); // Mở rộng danh sách sản phẩm
    toggleButtons.querySelector(".show-more").style.display = "none"; // Ẩn nút "Hiển thị tất cả"
    toggleButtons.querySelector(".show-less").style.display = "inline-block"; // Hiển thị nút "Thu nhỏ"
}

// Thu nhỏ sản phẩm
function shrinkProducts(button) {
    const toggleButtons = button.closest(".toggle-buttons"); // Find the toggle-buttons div
    if (!toggleButtons) {
        console.error("Không tìm thấy .toggle-buttons");
        return;
    }

    const container = toggleButtons.previousElementSibling; // Assume the container is the previous sibling
    if (!container || !container.classList.contains("container")) {
        console.error("Không tìm thấy .container");
        return;
    }

    const productsContainer = container.querySelector(".products-carousel .products");
    if (!productsContainer) {
        console.error("Không tìm thấy .products bên trong .products-carousel");
        return;
    }

    productsContainer.classList.remove("expand"); // Thu nhỏ danh sách sản phẩm
    toggleButtons.querySelector(".show-less").style.display = "none"; // Ẩn nút "Thu nhỏ"
    toggleButtons.querySelector(".show-more").style.display = "inline-block"; // Hiển thị nút "Hiển thị tất cả"
}
// Script để thay đổi hình ảnh chính khi ảnh thu nhỏ được nhấp
document.querySelectorAll('.product-thumbnails img').forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
        document.getElementById('product-image').src = this.src;
    });
});

// Script để tự động thay đổi hình ảnh chính mỗi 2 giây
const thumbnails = document.querySelectorAll('.product-thumbnails img');
let currentIndex = 0;

function autoSlide() {
    if (thumbnails.length > 0) {
        currentIndex = (currentIndex + 1) % thumbnails.length; // Chuyển sang ảnh tiếp theo
        document.getElementById('product-image').src = thumbnails[currentIndex].src;
    }
}

setInterval(autoSlide, 2000); // Thay đổi ảnh mỗi 3 giây

// Script để điều hướng đánh giá với hiệu ứng lướt mượt mà
let currentReviewIndex = 0;
const reviews = document.querySelectorAll('.review');
const totalReviews = reviews.length;
const reviewsPerPage = 4;

function showReviews(startIndex) {
    reviews.forEach((review, i) => {
        review.style.display = (i >= startIndex && i < startIndex + reviewsPerPage) ? 'block' : 'none';
    });
    const reviewsList = document.getElementById('reviews-list');
    if (reviewsList && reviews.length > 0) {
        reviewsList.scrollTo({
            top: 0,
            left: startIndex * reviews[0].offsetWidth,
            behavior: 'smooth'
        });
    }
}

const prevBtn2 = document.querySelector('.prev-btn');
if (prevBtn2) {
    prevBtn2.addEventListener('click', () => {
        currentReviewIndex = (currentReviewIndex - reviewsPerPage + totalReviews) % totalReviews;
        showReviews(currentReviewIndex);
    });
}

const nextBtn2 = document.querySelector('.next-btn');
if (nextBtn2) {
    nextBtn2.addEventListener('click', () => {
        currentReviewIndex = (currentReviewIndex + reviewsPerPage) % totalReviews;
        showReviews(currentReviewIndex);
    });
}

showReviews(currentReviewIndex);

// Script để hiển thị popup khi click vào ảnh
const productImage = document.getElementById('product-image');
const imagePopup = document.getElementById('imagePopup');
const popupImage = document.getElementById('popupImage');
const closePopup = document.querySelector('.close-popup');
const prevPopup = document.querySelector('.prev-popup');
const nextPopup = document.querySelector('.next-popup');

if (productImage) {
    productImage.addEventListener('click', () => {
        popupImage.src = productImage.src;
        currentIndex = Array.from(thumbnails).findIndex(img => img.src === productImage.src);
        imagePopup.style.display = 'block';
    });
}

if (closePopup) {
    closePopup.addEventListener('click', () => {
        imagePopup.style.display = 'none';
    });
}

if (prevPopup) {
    prevPopup.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
        popupImage.src = thumbnails[currentIndex].src;
    });
}

if (nextPopup) {
    nextPopup.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % thumbnails.length;
        popupImage.src = thumbnails[currentIndex].src;
    });
}

if (imagePopup) {
    window.addEventListener('click', (event) => {
        if (event.target === imagePopup) {
            imagePopup.style.display = 'none';
        }
    });
}

function getSearchParams() {
    return {
        keyword: document.getElementById('searchInput').value.trim(),
        brand_id: document.getElementById('searchBrand').value,
        category_id: document.getElementById('searchCategory').value,
        sort: document.getElementById('filter-sort').value
    };
}

function doSearch({ keyword = '', brand_id = '', category_id = '', sort = '' }) {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (brand_id) params.append('brand_id', brand_id);
    if (category_id) params.append('category_id', category_id);
    if (sort) params.append('sort', sort);
    window.location.href = `/search?${params.toString()}`;
}

function renderSearchResults(products) {
    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;
    if (!products.length) {
        resultsDiv.innerHTML = '<p>Không tìm thấy sản phẩm phù hợp.</p>';
        return;
    }
    resultsDiv.innerHTML = `
        <div class="container">
            <div class="products-carousel">
                <div class="products">
                    ${products.map(product => `
                        <div class="product">
                            <div class="favorite-btn"><i class="far fa-heart"></i></div>
                            ${product.is_new ? `<span class="badge badge-new">Mới</span>` : ''}
                            ${product.is_best_seller ? `<span class="badge badge-hot">Bán chạy</span>` : ''}
                            <img src="${product.image_url || '/img/default.jpg'}" alt="${product.name || 'No Name'}">
                            <h3>${product.name || 'No Name'}</h3>
                            <p class="original-price">Giá gốc: ${formatPrice(product.price || 0)}</p>
                            ${product.discount ? `
                                <p class="discount">Giảm giá: ${product.discount}%</p>
                                <p class="discounted-price">CHỈ CÒN: ${formatPrice(Math.ceil(product.price * (1 - product.discount / 100)))}</p>
                            ` : ''}
                            <div class="product-stats">
                                <span class="sales-count"><i class="fas fa-shopping-cart"></i> ${product.sold_quantity || 0} đã bán</span>
                                <div class="rating">
                                    <span class="stars">${generateStars(product.average_rating || 0)}</span>
                                    <span class="rating-count">(${product.review_count || 0})</span>
                                </div>
                            </div>
                            <div class="cart">
                                <form action="/product/detail/${product.product_id}" method="GET">
                                    <button type="submit">Xem chi tiết</button>
                                </form>
                                <form class="add-to-cart-form" data-product-id="${product.product_id}">
                                    <input type="hidden" name="product_id" value="${product.product_id}">
                                    <button type="submit" title="Thêm vào giỏ hàng">
                                        <i class="fa-solid fa-cart-shopping"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}