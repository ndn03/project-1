document.querySelectorAll(".delete-form").forEach(form => {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();
        const cartItemId = this.action.split("/").pop();

        try {
            const response = await fetch(`/cart/${cartItemId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            });

            const result = await response.json();
            if (response.ok) {
                alert("Alert: Đã xóa sản phẩm khỏi giỏ hàng");
                window.location.reload(); // Tải lại trang để cập nhật giỏ hàng
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Alert: Có lỗi xảy ra khi xóa sản phẩm");
        }
    });
});