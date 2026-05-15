import mongoose from "mongoose";
import "./product.model";

const cartSchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   products: [
      {
         productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
         quantity: { type: Number, required: true, default: 1 },
      },
   ],
},
   {
      timestamps: true,
   }
);

export const Cart = mongoose.model("Cart", cartSchema, "carts");
