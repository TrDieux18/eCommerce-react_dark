import {
   login,
   register,
   getUserById,
   updateUser,
   getAllUsers,
   deleteUser,
} from "../controllers/user.controller";
import express from "express";
const router = express.Router();

// ---------------------------------------------------------------------------
// Client Routes (proxied từ Gateway)
// ---------------------------------------------------------------------------
router.post("/login", login);
router.post("/register", register);
router.get("/profile/:id", getUserById);
router.patch("/profile/:id", updateUser);

// ---------------------------------------------------------------------------
// Admin Routes (proxied từ Gateway với prefix /admin)
// ---------------------------------------------------------------------------
router.get("/admin/users", getAllUsers);
router.patch("/admin/users/:id", updateUser);
router.delete("/admin/users/:id", deleteUser);

export default router;
