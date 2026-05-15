import { Request, Response } from "express";
import cartService from "../services/cart.service";

export const getCart = async (req: Request, res: Response) => {
   try {
      const userId = req.params.userId as string;
      const cart = await cartService.getCart(userId);
      res.status(200).json({ success: true, data: cart });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const addToCart = async (req: Request, res: Response) => {
   try {
      const { userId, productId, quantity = 1 } = req.body;
      const cart = await cartService.addToCart(userId, productId, quantity);
      res.status(200).json({ success: true, data: cart });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const updateCartItem = async (req: Request, res: Response) => {
   try {
      const { userId, productId, quantity } = req.body;
      const cart = await cartService.updateCartItem(userId, productId, quantity);
      res.status(200).json({ success: true, data: cart });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const removeFromCart = async (req: Request, res: Response) => {
   try {
      const { userId, productId } = req.body;
      const cart = await cartService.removeFromCart(userId, productId);
      res.status(200).json({ success: true, data: cart });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const clearCart = async (req: Request, res: Response) => {
   try {
      const userId = req.params.userId as string;
      const cart = await cartService.clearCart(userId);
      res.status(200).json({ success: true, data: cart });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

// ---------------------------------------------------------------------------
// Internal Controller — gọi bởi order-service, không qua Gateway
// ---------------------------------------------------------------------------

export const internalClearCart = async (req: Request, res: Response) => {
   try {
      const userId = req.params.userId as string;
      const cart = await cartService.clearCart(userId);
      res.status(200).json({ success: true, data: cart });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};
