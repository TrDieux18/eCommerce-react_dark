import Invoice from "../models/invoice.model";
import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { invalidateRecommendationCache } from "./nextPurchasePrediction.service";

export class InvoiceService {
   async createInvoice(
      userId: string,
      products: Array<{ productId: string; quantity: number; price: number }>,
      clearCart: boolean = false
   ) {
      if (!userId || !products || products.length === 0) {
         throw { status: 400, message: "Missing required fields" };
      }

      // Validate products and stock
      for (const item of products) {
         const product = await Product.findById(item.productId);

         if (!product) {
            throw {
               status: 404,
               message: `Product ${item.productId} not found`,
            };
         }

         if (product.stock < item.quantity) {
            throw {
               status: 400,
               message: `Insufficient stock for product ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`,
            };
         }
      }

      // Update product stock
      for (const item of products) {
         await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
         );
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

      // Invalidate recommendation cache for this user (background, non-blocking)
      invalidateRecommendationCache(userId).catch(() => {});

      // Clear cart if requested
      if (clearCart) {
         await Cart.findOneAndUpdate({ userId }, { products: [] });
      }

      return invoice;
   }

   async getInvoicesByUser(userId: string) {
      const invoices = await Invoice.find({ userId })
         .populate("products.productId")
         .sort({ createdAt: -1 });

      return invoices;
   }

   async getAllInvoices() {
      const invoices = await Invoice.find()
         .populate("userId", "username email")
         .populate("products.productId")
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

      // Restore stock if cancelling a pending order
      if (currentInvoice.status === "pending" && status === "cancelled") {
         for (const item of currentInvoice.products) {
            await Product.findByIdAndUpdate(
               item.productId,
               { $inc: { stock: item.quantity } }
            );
         }
      }

      const invoice = await Invoice.findByIdAndUpdate(
         id,
         { status },
         { new: true }
      )
         .populate("userId", "username")
         .populate("products.productId");

      return invoice;
   }
}

export default new InvoiceService();
