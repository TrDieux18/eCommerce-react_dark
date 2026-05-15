import axios from "axios";

const CART_SERVICE_URL =
   process.env.CART_SERVICE_URL || "http://localhost:3003";

/**
 * HTTP Client gọi đến Cart Service.
 * Dùng cho order-service khi cần xoá giỏ hàng sau khi đặt đơn.
 */
export const cartClient = {
   async clearCart(userId: string) {
      const { data } = await axios.delete(
         `${CART_SERVICE_URL}/internal/cart/clear/${userId}`,
         { timeout: 5000 }
      );
      return data;
   },
};
