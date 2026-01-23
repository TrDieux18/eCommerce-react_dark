import { User } from "../models/user.model";

export class UserService {
   async login(username: string, password: string) {
      const user = await User.findOne({ username: username, isActive: true });

      if (!user) {
         throw { status: 404, message: "User not found" };
      }
      if (user.password !== password) {
         throw { status: 401, message: "Invalid credentials" };
      }

      return user;
   }

   async register(username: string, password: string) {
      if (!username || !password) {
         throw { status: 400, message: "Username and password are required" };
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
         throw { status: 409, message: "Username already exists" };
      }

      const newUser = new User({
         username,
         password,
         role: "user",
         isActive: true,
      });

      await newUser.save();
      return newUser;
   }

   async getAllUsers(page: number, limit: number, search: string) {
      const query: any = {};
      if (search) {
         query.username = { $regex: search, $options: "i" };
      }

      const skip = (page - 1) * limit;

      const users = await User.find(query)
         .select("-password")
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit);

      const total = await User.countDocuments(query);

      return {
         users,
         total,
         totalPages: Math.ceil(total / limit),
         currentPage: page,
      };
   }

   async getUserById(id: string) {
      const user = await User.findById(id).select("-password");

      if (!user) {
         throw { status: 404, message: "User not found" };
      }

      return user;
   }

   async updateUser(id: string, updateData: {
      username?: string;
      password?: string;
      role?: "admin" | "user";
      isActive?: boolean;
   }) {
      const user = await User.findById(id);
      if (!user) {
         throw { status: 404, message: "User not found" };
      }

      if (updateData.username && updateData.username !== user.username) {
         const existingUser = await User.findOne({ username: updateData.username });
         if (existingUser) {
            throw { status: 409, message: "Username already exists" };
         }
         user.username = updateData.username;
      }

      if (updateData.password) user.password = updateData.password;
      if (updateData.role) user.role = updateData.role;
      if (typeof updateData.isActive === "boolean") user.isActive = updateData.isActive;

      await user.save();

      const updatedUser = await User.findById(id).select("-password");
      return updatedUser;
   }

   async deleteUser(id: string) {
      const user = await User.findByIdAndDelete(id);

      if (!user) {
         throw { status: 404, message: "User not found" };
      }

      return user;
   }
}

export default new UserService();
