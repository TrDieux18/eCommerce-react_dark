import {
   getCart,
   addToCart,
   updateCartItem,
   removeFromCart,
   clearCart,
   internalClearCart,
} from "../controllers/cart.controller";
import express from "express";
const router = express.Router();

// ---------------------------------------------------------------------------
// Client Routes (proxied từ Gateway)
// ---------------------------------------------------------------------------
router.get("/cart/:userId", getCart);
router.post("/cart/add", addToCart);
router.patch("/cart/update", updateCartItem);
router.delete("/cart/remove", removeFromCart);
router.delete("/cart/clear/:userId", clearCart);

// ---------------------------------------------------------------------------
// Internal Routes — gọi trực tiếp bởi order-service (không qua Gateway)
// ---------------------------------------------------------------------------
router.delete("/internal/cart/clear/:userId", internalClearCart);

export default router;
