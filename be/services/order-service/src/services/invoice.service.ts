import Invoice from "../models/invoice.model";
import { productClient } from "../clients/product.client";
import { cartClient } from "../clients/cart.client";
import { recommendationClient } from "../clients/recommendation.client";

export class InvoiceService {
   async createInvoice(
      userId: string,
      products: Array<{ productId: string; quantity: number; price: number }>,
      clearCart: boolean = false
   ) {
      if (!userId || !products || products.length === 0) {
         throw { status: 400, message: "Missing required fields" };
      }

      // Validate stock & decrement via Product Service (HTTP)
      for (const item of products) {
         try {
            await productClient.validateAndDecrementStock(
               item.productId,
               item.quantity
            );
         } catch (err: any) {
            const message =
               err.response?.data?.message || err.message || "Stock validation failed";
            throw { status: err.response?.status || 500, message };
         }
      }

      // Calculate total amount
      const totalAmount = products.reduce(
         (sum: number, item: any) => sum + item.price * item.quantity,
         0
      );

      // Create invoice
      const invoice = new Invoice({
         userId,
         products,
         totalAmount,
         status: "pending",
      });

      await invoice.save();

      // Invalidate recommendation cache (non-blocking, fire-and-forget)
      recommendationClient.invalidateCache(userId);

      // Clear cart via Cart Service (HTTP) if requested
      if (clearCart) {
         try {
            await cartClient.clearCart(userId);
         } catch (err: any) {
            console.warn("⚠️ Failed to clear cart:", err?.message);
         }
      }

      return invoice;
   }

   async getInvoicesByUser(userId: string) {
      const invoices = await Invoice.find({ userId })
         .sort({ createdAt: -1 });

      return invoices;
   }

   async getAllInvoices() {
      const invoices = await Invoice.find()
         .sort({ createdAt: -1 });

      return invoices;
   }

   async updateInvoiceStatus(id: string, status: string) {
      if (!["pending", "paid", "cancelled"].includes(status)) {
         throw { status: 400, message: "Invalid status value" };
      }

      const currentInvoice = await Invoice.findById(id);

      if (!currentInvoice) {
         throw { status: 404, message: "Invoice not found" };
      }

      // Restore stock via Product Service if cancelling a pending order
      if (currentInvoice.status === "pending" && status === "cancelled") {
         for (const item of currentInvoice.products) {
            try {
               await productClient.restoreStock(
                  item.productId.toString(),
                  item.quantity
               );
            } catch (err: any) {
               console.warn("⚠️ Failed to restore stock:", err?.message);
            }
         }
      }

      const invoice = await Invoice.findByIdAndUpdate(
         id,
         { status },
         { new: true }
      );

      return invoice;
   }
}

export default new InvoiceService();
