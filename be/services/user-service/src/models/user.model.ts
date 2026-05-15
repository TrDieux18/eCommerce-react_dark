import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
   username: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   role: { type: String, enum: ['admin', 'user'], default: 'user' },
   isActive: { type: Boolean, default: true },
}, {
   timestamps: true,
})

export const User = mongoose.model("User", userSchema, "users")
