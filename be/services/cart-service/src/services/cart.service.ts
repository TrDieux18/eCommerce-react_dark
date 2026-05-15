import { Types } from "mongoose";
import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";

export class CartService {
   async getCart(userId: string) {
      if (!userId) {
         throw { status: 400, message: "User ID is required" };
      }

      let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) })
         .populate("products.productId");

      if (!cart) {
         cart = new Cart({
            userId: new Types.ObjectId(userId),
            products: []
         });
         await cart.save();
      }

      return cart;
   }

   async addToCart(userId: string, productId: string, quantity: number = 1) {
      if (!userId || !productId) {
         throw { status: 400, message: "User ID and Product ID are required" };
      }

      let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });

      if (!cart) {
         cart = new Cart({
            userId: new Types.ObjectId(userId),
            products: [{ productId: new Types.ObjectId(productId), quantity }]
         });
      } else {
         const productIndex = cart.products.findIndex(
            (p) => p.productId.toString() === productId
         );

         if (productIndex > -1) {
            cart.products[productIndex].quantity += quantity;
         } else {
            cart.products.push({ productId: new Types.ObjectId(productId), quantity });
         }
      }

      await cart.save();
      await cart.populate("products.productId");

      return cart;
   }

   async updateCartItem(userId: string, productId: string, quantity: number) {
      if (!userId || !productId || quantity === undefined) {
         throw { status: 400, message: "User ID, Product ID and Quantity are required" };
      }

      const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });

      if (!cart) {
         throw { status: 404, message: "Cart not found" };
      }

      const productIndex = cart.products.findIndex(
         (p) => p.productId.toString() === productId
      );

      if (productIndex === -1) {
         throw { status: 404, message: "Product not found in cart" };
      }

      if (quantity <= 0) {
         cart.products.splice(productIndex, 1);
      } else {
         cart.products[productIndex].quantity = quantity;
      }

      await cart.save();
      await cart.populate("products.productId");

      return cart;
   }

   async removeFromCart(userId: string, productId: string) {
      if (!userId || !productId) {
         throw { status: 400, message: "User ID and Product ID are required" };
      }

      const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });

      if (!cart) {
         throw { status: 404, message: "Cart not found" };
      }

      const filteredProducts = cart.products.filter(
         (p) => p.productId.toString() !== productId
      );
      cart.products.splice(0, cart.products.length, ...filteredProducts);

      await cart.save();
      await cart.populate("products.productId");

      return cart;
   }

   async clearCart(userId: string) {
      if (!userId) {
         throw { status: 400, message: "User ID is required" };
      }

      const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });

      if (!cart) {
         throw { status: 404, message: "Cart not found" };
      }

      cart.products.splice(0, cart.products.length);
      await cart.save();

      return cart;
   }
}

export default new CartService();
