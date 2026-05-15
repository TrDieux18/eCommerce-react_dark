import axios from "axios";

const RECOMMENDATION_SERVICE_URL =
   process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:3005";

/**
 * HTTP Client gọi đến Recommendation Service.
 * Dùng để invalidate cache sau khi tạo đơn hàng mới.
 */
export const recommendationClient = {
   async invalidateCache(userId: string) {
      try {
         await axios.post(
            `${RECOMMENDATION_SERVICE_URL}/internal/recommendations/invalidate`,
            { userId },
            { timeout: 3000 }
         );
      } catch (err: any) {
         // Non-blocking: nếu recommendation service không khả dụng,
         // đơn hàng vẫn được tạo thành công
         console.warn(
            "⚠️ Failed to invalidate recommendation cache:",
            err?.message
         );
      }
   },
};
