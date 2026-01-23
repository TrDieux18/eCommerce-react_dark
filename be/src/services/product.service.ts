import { Types } from "mongoose";
import { Product } from "../models/product.model";

export class ProductService {
   async getAllProducts(page: number, limit: number, search: string, category: string) {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (search) {
         query.title = { $regex: search, $options: 'i' };
      }

      if (category && category !== 'all') {
         query.slug = { $regex: category, $options: 'i' };
      }

      const products = await Product.find(query)
         .skip(skip)
         .limit(limit)
         .sort({ createdAt: -1 });

      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
         products,
         total,
         totalPages,
         currentPage: page,
      };
   }

   async createProduct(productData: {
      title: string;
      description: string;
      price: number;
      discountPercentage?: number;
      rating?: number;
      stock: number;
      thumbnail: string;
      slug: string;
   }) {
      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();
      return savedProduct;
   }

   async updateProduct(
      id: string,
      productData: {
         title?: string;
         description?: string;
         price?: number;
         discountPercentage?: number;
         rating?: number;
         stock?: number;
         thumbnail?: string;
         slug?: string;
      }
   ) {
      const updatedProduct = await Product.findByIdAndUpdate(
         id,
         productData,
         { new: true }
      );

      if (!updatedProduct) {
         throw { status: 404, message: "Product not found" };
      }

      return updatedProduct;
   }

   async getProductById(id: string) {
      const product = await Product.findById(new Types.ObjectId(id));

      if (!product) {
         throw { status: 404, message: "Product not found" };
      }

      return product;
   }

   async deleteProduct(id: string) {
      const deletedProduct = await Product.findByIdAndDelete(new Types.ObjectId(id));

      if (!deletedProduct) {
         throw { status: 404, message: "Product not found" };
      }

      return deletedProduct;
   }
}

export default new ProductService();
