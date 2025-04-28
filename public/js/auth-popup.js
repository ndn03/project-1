document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabs = document.querySelectorAll(".tab");

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabButtons.forEach((b) => b.classList.remove("active"));
            tabs.forEach((tab) => tab.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });

    const forgotPasswordForm = document.getElementById("forgot-password-form");
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("forgot-email").value.trim();

            if (!email) {
                alert("Vui lòng nhập email của bạn.");
                return;
            }

            try {
                const response = await fetch("/auth/forgot-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                });

                if (response.ok) {
                    alert("Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.");
                } else {
                    const data = await response.json();
                    alert(data.error || "Không thể gửi yêu cầu đặt lại mật khẩu.");
                }
            } catch (error) {
                console.error("Lỗi khi gửi yêu cầu đặt lại mật khẩu:", error);
                alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
            }
        });
    }
});
