import {
   getAllProducts,
   getProductById,
   createProduct,
   updateProduct,
   deleteProduct,
   internalGetProduct,
   internalDecrementStock,
   internalRestoreStock,
} from "../controllers/product.controller";
import express from "express";
const router = express.Router();

// ---------------------------------------------------------------------------
// Client Routes (proxied từ Gateway)
// ---------------------------------------------------------------------------
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);

// ---------------------------------------------------------------------------
// Admin Routes (proxied từ Gateway với prefix /admin)
// ---------------------------------------------------------------------------
router.post("/admin/products/new", createProduct);
router.patch("/admin/products/edit", updateProduct);
router.delete("/admin/products/delete/:id", deleteProduct);

// ---------------------------------------------------------------------------
// Internal Routes — gọi trực tiếp bởi order-service (không qua Gateway)
// ---------------------------------------------------------------------------
router.get("/internal/products/:id", internalGetProduct);
router.patch("/internal/products/:id/decrement-stock", internalDecrementStock);
router.patch("/internal/products/:id/restore-stock", internalRestoreStock);

export default router;
