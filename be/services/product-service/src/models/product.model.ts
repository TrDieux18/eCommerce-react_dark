import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
   {
      title: { type: String, required: true },
      description: { type: String, required: true },
      price: { type: Number, required: true },
      discountPercentage: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      stock: { type: Number, default: 0 },
      thumbnail: { type: String, required: true },
      isActive: { type: Boolean, default: true },
      slug: { type: String, required: true, unique: true },
   },
   {
      timestamps: true,
   }
);

export const Product = mongoose.model("Product", productSchema, "products");
