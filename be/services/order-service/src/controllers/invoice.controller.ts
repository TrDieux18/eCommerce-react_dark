import { Request, Response } from "express";
import invoiceService from "../services/invoice.service";

export const createInvoice = async (req: Request, res: Response) => {
   try {
      const { userId, products, clearCart } = req.body;
      const invoice = await invoiceService.createInvoice(userId, products, clearCart);

      res.status(201).json({
         success: true,
         message: "Đặt hàng thành công",
         data: invoice,
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
         success: false,
         message: error.message,
      });
   }
};

export const getInvoicesByUser = async (req: Request, res: Response) => {
   try {
      const userId = req.params.userId as string;
      const invoices = await invoiceService.getInvoicesByUser(userId);

      res.status(200).json({
         success: true,
         data: invoices,
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
         success: false,
         message: error.message,
      });
   }
};

export const getAllInvoices = async (req: Request, res: Response) => {
   try {
      const invoices = await invoiceService.getAllInvoices();

      res.status(200).json({
         success: true,
         data: invoices,
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
         success: false,
         message: error.message,
      });
   }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
   try {
      const id = req.params.id as string;
      const { status } = req.body;

      const invoice = await invoiceService.updateInvoiceStatus(id, status);

      res.status(200).json({
         success: true,
         message: "Invoice status updated successfully",
         data: invoice,
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
         success: false,
         message: error.message,
      });
   }
};
