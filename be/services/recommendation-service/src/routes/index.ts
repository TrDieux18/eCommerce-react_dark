import {
   getNextPurchasePrediction,
   internalInvalidateCache,
} from "../controllers/recommendation.controller";
import express from "express";
const router = express.Router();

// ---------------------------------------------------------------------------
// Client Routes (proxied từ Gateway)
// ---------------------------------------------------------------------------
router.get(
   "/recommendations/next-purchase/:userId",
   getNextPurchasePrediction
);

// ---------------------------------------------------------------------------
// Internal Routes — gọi bởi order-service để invalidate cache
// ---------------------------------------------------------------------------
router.post(
   "/internal/recommendations/invalidate",
   internalInvalidateCache
);

export default router;
