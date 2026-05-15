import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import orderRoutes from "./routes/index";

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
      `[Order Service] ${req.method} ${req.originalUrl} [${correlationId}]`
   );
   next();
});

// Routes
app.use("/", orderRoutes);

// Health Check
app.get("/health", (req, res) => {
   res.json({ status: "ok", service: "order-service" });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
   console.log(`Order Service running on http://localhost:${PORT}`);
});
