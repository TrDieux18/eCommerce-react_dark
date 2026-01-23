import { Request, Response } from "express";
import productService from "../services/product.service";

export const getAllProducts = async (req: Request, res: Response) => {
   try {
      const { page = '1', limit = '10', search = '', category = '' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const result = await productService.getAllProducts(
         pageNum,
         limitNum,
         search as string,
         category as string
      );

      res.status(200).json({
         success: true,
         data: result.products,
         totalPages: result.totalPages,
         currentPage: result.currentPage,
         total: result.total
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
}

export const createProduct = async (req: Request, res: Response) => {
   try {
      const { title, description, price, discountPercentage, rating, stock, thumbnail, slug } = req.body;

      const savedProduct = await productService.createProduct({
         title,
         description,
         price,
         discountPercentage,
         rating,
         stock,
         thumbnail,
         slug
      });

      res.status(201).json({ success: true, data: savedProduct });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const updateProduct = async (req: Request, res: Response) => {
   try {
      const { _id, title, description, price, discountPercentage, rating, stock, thumbnail, slug } = req.body;

      const updatedProduct = await productService.updateProduct(_id, {
         title,
         description,
         price,
         discountPercentage,
         rating,
         stock,
         thumbnail,
         slug
      });

      res.status(200).json({ success: true, data: updatedProduct });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const getProductById = async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.status(200).json({ success: true, data: product });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
};

export const deleteProduct = async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res.status(200).json({ success: true, message: "Product deleted successfully" });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
   }
}