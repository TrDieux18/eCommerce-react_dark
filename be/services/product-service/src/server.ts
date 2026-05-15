import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import productRoutes from "./routes/index";

dotenv.config({ quiet: true } as any);

connectDB();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging with Correlation ID
app.use((req, res, next) => {
   const correlationId = req.headers["x-correlation-id"] || "N/A";
   console.log(
      `[Product Service] ${req.method} ${req.originalUrl} [${correlationId}]`
   );
   next();
});

// Routes
app.use("/", productRoutes);

// Health Check
app.get("/health", (req, res) => {
   res.json({ status: "ok", service: "product-service" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
   console.log(`Product Service running on http://localhost:${PORT}`);
});
