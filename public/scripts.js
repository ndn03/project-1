function showLoginPopup() {
    const popup = document.getElementById('authPopup'); // Ensure the ID matches
    if (popup) {
        popup.style.display = 'block'; // Show the popup
    }
}

// Đóng popup
document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.querySelector('.close-btn');
    const popup = document.getElementById('authPopup');

    if (closeBtn && popup) {
        closeBtn.onclick = function () {
            popup.style.display = 'none'; // Hide the popup
        };
    }

    // Đóng popup khi click bên ngoài
    window.onclick = function (event) {
        if (event.target === popup) {
            popup.style.display = 'none'; // Hide the popup
        }
    };
});

// Chuyển đổi giữa các tab
function openTab(tabName, event) {
    // Ẩn tất cả tab content
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    // Bỏ active khỏi tất cả các tab buttons
    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    // Hiển thị tab được chọn và active button tương ứng
    document.getElementById(tabName).classList.add('active');
    if (event) {
        event.currentTarget.classList.add('active');
    }
}

// Hiển thị tất cả sản phẩm
function showAllProducts(button) {
    const productsContainer = button.closest(".container").querySelector(".products");
    if (productsContainer) {
        productsContainer.classList.remove("shrink"); // Remove the shrink class to show all products
        button.style.display = "none"; // Hide "Hiển thị tất cả" button
        button.nextElementSibling.style.display = "inline-block"; // Show "Thu nhỏ" button
    }
}

// Thu nhỏ sản phẩm
function shrinkProducts(button) {
    const productsContainer = button.closest(".container").querySelector(".products");
    if (productsContainer) {
        productsContainer.classList.add("shrink"); // Add the shrink class to limit product display
        button.style.display = "none"; // Hide "Thu nhỏ" button
        button.previousElementSibling.style.display = "inline-block"; // Show "Hiển thị tất cả" button
    }
}
