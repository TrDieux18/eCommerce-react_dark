import {
   createInvoice,
   getInvoicesByUser,
   getAllInvoices,
   updateInvoiceStatus,
} from "../controllers/invoice.controller";
import express from "express";
const router = express.Router();

// ---------------------------------------------------------------------------
// Client Routes (proxied từ Gateway)
// ---------------------------------------------------------------------------
router.post("/invoices", createInvoice);
router.get("/invoices/user/:userId", getInvoicesByUser);

// ---------------------------------------------------------------------------
// Admin Routes (proxied từ Gateway với prefix /admin)
// ---------------------------------------------------------------------------
router.get("/admin/invoices", getAllInvoices);
router.patch("/admin/invoices/:id/status", updateInvoiceStatus);

export default router;
