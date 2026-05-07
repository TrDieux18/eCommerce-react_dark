import {
  getAllProducts,
  getProductById,
} from "../../controllers/product.controller";
import {
  login,
  register,
  getUserById,
  updateUser,
} from "../../controllers/user.controller";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../controllers/cart.controller";
import {
  createInvoice,
  getInvoicesByUser,
} from "../../controllers/invoice.controller";
import { getNextPurchasePrediction } from "../../controllers/recommendation.controller";
import express from "express";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);

router.get("/cart/:userId", getCart);
router.post("/cart/add", addToCart);
router.patch("/cart/update", updateCartItem);
router.delete("/cart/remove", removeFromCart);
router.delete("/cart/clear/:userId", clearCart);

router.post("/invoices", createInvoice);
router.get("/invoices/user/:userId", getInvoicesByUser);
router.get("/recommendations/next-purchase/:userId", getNextPurchasePrediction);

router.get("/profile/:id", getUserById);
router.patch("/profile/:id", updateUser);

export default router;
