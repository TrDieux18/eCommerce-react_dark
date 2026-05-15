import axios from "axios";

const PRODUCT_SERVICE_URL =
   process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";

/**
 * HTTP Client gọi đến Product Service.
 * Dùng cho order-service khi cần validate stock và cập nhật tồn kho.
 */
export const productClient = {
   async getProductById(productId: string) {
      const { data } = await axios.get(
         `${PRODUCT_SERVICE_URL}/internal/products/${productId}`,
         { timeout: 5000 }
      );
      return data;
   },

   async validateAndDecrementStock(productId: string, quantity: number) {
      const { data } = await axios.patch(
         `${PRODUCT_SERVICE_URL}/internal/products/${productId}/decrement-stock`,
         { quantity },
         { timeout: 5000 }
      );
      return data;
   },

   async restoreStock(productId: string, quantity: number) {
      const { data } = await axios.patch(
         `${PRODUCT_SERVICE_URL}/internal/products/${productId}/restore-stock`,
         { quantity },
         { timeout: 5000 }
      );
      return data;
   },
};
