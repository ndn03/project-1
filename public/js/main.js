// Hiển thị popup đăng nhập
console.log("Main.js is executing...");
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM đã tải xong, bắt đầu gán sự kiện...");
});

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

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            const user = await response.json();
            localStorage.setItem("authToken", user.accessToken);
            localStorage.setItem("refreshToken", user.refreshToken);
            alert("Đăng nhập thành công!");
            updateHeader(user);
            updateFooter(user);
            document.getElementById("authPopup").style.display = "none";
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Đăng nhập thất bại.");
        }
    } catch (error) {
        alert("Lỗi kết nối server.");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkUserStatus(); // Kiểm tra trạng thái người dùng
    updateFooter(user); // Cập nhật footer dựa trên trạng thái đăng nhập
});

async function checkUserStatus() {
    let token = localStorage.getItem("authToken");
    let refreshToken = localStorage.getItem("refreshToken");
    if (!token) return;

    try {
        let response = await fetchWithAuth("/auth/status", { method: "GET" });
        if (response.ok) {
            const user = await response.json();
            updateHeader(user);
            return user;
        } else if (response.status === 403) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            alert("Tài khoản không hợp lệ hoặc bị vô hiệu hóa.");
        }
    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái:", error);
    }
}

async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("authToken");
    let refreshToken = localStorage.getItem("refreshToken");
    if (!token) throw new Error("No auth token available");

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    let response = await fetch(url, options);
    if (response.status === 401 && refreshToken) {
        let refreshResponse = await fetch("/auth/refreshToken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
            let data = await refreshResponse.json();
            localStorage.setItem("authToken", data.accessToken);
            options.headers.Authorization = `Bearer ${data.accessToken}`;
            response = await fetch(url, options);
        } else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
            window.location.href = "/login";
        }
    }
    return response;
}

function updateHeader(user) {
    const nav = document.querySelector("header nav ul");
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
                    <li><a href="/cart">Giỏ hàng</a></li>
                    <li><a href="/account">Tài khoản</a></li>
                ` : `
                    <li><a href="/admin">Quản trị hệ thống</a></li>
                `}
                <li><a href="#" onclick="logout(); return false;">Đăng xuất</a></li>
            </ul>
        </li>
    `;
}

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
            <li><a href="/login">Đăng nhập</a></li>
            <li><a href="/register">Đăng ký</a></li>
        `;
    }
}

function logout() {
    fetchWithAuth("/auth/logout", { method: "POST" })
        .then(() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            alert("Đăng xuất thành công!");
            window.location.reload();
        })
        .catch(() => alert("Lỗi khi đăng xuất."));
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
    reviewsList.scrollTo({
        top: 0,
        left: startIndex * reviews[0].offsetWidth,
        behavior: 'smooth' // Add smooth scrolling effect
    });
}

document.querySelector('.prev-btn').addEventListener('click', () => {
    currentReviewIndex = (currentReviewIndex - reviewsPerPage + totalReviews) % totalReviews;
    showReviews(currentReviewIndex);
});

document.querySelector('.next-btn').addEventListener('click', () => {
    currentReviewIndex = (currentReviewIndex + reviewsPerPage) % totalReviews;
    showReviews(currentReviewIndex);
});

showReviews(currentReviewIndex);

// Script để hiển thị popup khi click vào ảnh
const productImage = document.getElementById('product-image');
const imagePopup = document.getElementById('imagePopup');
const popupImage = document.getElementById('popupImage');
const closePopup = document.querySelector('.close-popup');
const prevPopup = document.querySelector('.prev-popup');
const nextPopup = document.querySelector('.next-popup');

productImage.addEventListener('click', () => {
    popupImage.src = productImage.src; // Set the popup image source
    currentIndex = Array.from(thumbnails).findIndex(img => img.src === productImage.src);
    imagePopup.style.display = 'block'; // Show the popup
});

closePopup.addEventListener('click', () => {
    imagePopup.style.display = 'none'; // Hide the popup
});

window.addEventListener('click', (event) => {
    if (event.target === imagePopup) {
        imagePopup.style.display = 'none'; // Hide the popup when clicking outside
    }
});

prevPopup.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
    popupImage.src = thumbnails[currentIndex].src;
});

nextPopup.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % thumbnails.length;
    popupImage.src = thumbnails[currentIndex].src;
});