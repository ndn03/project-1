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
    const productsContainer = button.closest(".container").querySelector(".products");
    if (productsContainer) {
        productsContainer.classList.remove("shrink");
        button.style.display = "none";
        button.nextElementSibling.style.display = "inline-block";
    }
}

// Thu nhỏ sản phẩm
function shrinkProducts(button) {
    const productsContainer = button.closest(".container").querySelector(".products");
    if (productsContainer) {
        productsContainer.classList.add("shrink");
        button.style.display = "none";
        button.previousElementSibling.style.display = "inline-block";
    }
}

// Xử lý đăng nhập
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert("Đăng nhập thành công!");
            window.location.reload(); // Tải lại trang sau khi đăng nhập thành công
        } else {
            alert("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
        }
    } catch (error) {
        alert("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.");
    }
});

// Xử lý đăng ký
document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert("Đăng ký thành công!");
            window.location.reload(); // Tải lại trang sau khi đăng ký thành công
        } else {
            alert("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
        }
    } catch (error) {
        alert("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
    }
});
