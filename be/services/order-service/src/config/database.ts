import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ quiet: true } as any);

const connectDB = async () => {
   try {
      await mongoose.connect(process.env.MONGO_URL as string);

      mongoose.connection.on("connected", () => {
         console.log("Mongoose connected to DB");
      });

      mongoose.connection.on("disconnected", () => {
         console.log("Mongoose disconnected");
      });

      mongoose.connection.on("error", (err: any) => {
         console.error("Mongoose connection error:", err.message);
      });

      console.log("MongoDB connected successfully!");
   } catch (error: any) {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
   }
};

export default connectDB;
