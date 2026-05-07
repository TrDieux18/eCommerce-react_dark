import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import { SYSTEM } from "./config/system";
import adminRoute from "./routes/admin/index.route";
import clientRoute from "./routes/client/index.route";

import { getCache, getCacheType } from "./config/redis";

dotenv.config();

connectDB();

// Kiểm tra kết nối Redis khi server khởi động
getCache().then(() => {
  console.log(`✅ Cache ready (type: ${getCacheType()})`);
});

const app = express();

app.use(cors({
   origin: process.env.ORIGIN_URL || "http://localhost:5173",
   credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
   console.log(`${req.method} ${req.originalUrl}`, {
      query: req.query,
      body: req.body,
      params: req.params,

   });
   next();
});

app.use(SYSTEM.PATH_ADMIN, adminRoute);
app.use(SYSTEM.PATH_CLIENT, clientRoute);



app.get("/", (req, res) => {
   res.send("Hello from BE + TypeScript + Vite!");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});
