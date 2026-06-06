import {
   getNextPurchasePrediction,
   internalInvalidateCache,
} from "../controllers/recommendation.controller";
import express from "express";
const router = express.Router();

router.get(
   "/recommendations/next-purchase/:userId",
   getNextPurchasePrediction
);


router.post(
   "/internal/recommendations/invalidate",
   internalInvalidateCache
);

export default router;
