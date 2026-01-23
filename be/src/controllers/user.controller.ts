import { Request, Response } from "express";
import userService from "../services/user.service";

export const login = async (req: Request, res: Response) => {
   try {
      const { username, password } = req.body;
      const user = await userService.login(username, password);
      return res.status(200).json({ success: true, data: user });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};

export const register = async (req: Request, res: Response) => {
   try {
      const { username, password } = req.body;
      const newUser = await userService.register(username, password);
      return res.status(201).json({
         success: true,
         message: "User registered successfully",
         data: newUser
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};

export const getAllUsers = async (req: Request, res: Response) => {
   try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const result = await userService.getAllUsers(pageNum, limitNum, search as string);

      return res.status(200).json({
         success: true,
         data: result.users,
         total: result.total,
         totalPages: result.totalPages,
         currentPage: result.currentPage,
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};

export const getUserById = async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      return res.status(200).json({ success: true, data: user });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};

export const updateUser = async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      const { username, password, role, isActive } = req.body;

      const updatedUser = await userService.updateUser(id, {
         username,
         password,
         role,
         isActive,
      });

      return res.status(200).json({
         success: true,
         message: "User updated successfully",
         data: updatedUser
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};

export const deleteUser = async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      await userService.deleteUser(id);
      return res.status(200).json({
         success: true,
         message: "User deleted successfully"
      });
   } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, message: error.message });
   }
};