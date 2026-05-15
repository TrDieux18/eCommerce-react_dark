import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import cartRoutes from "./routes/index";

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
      `[Cart Service] ${req.method} ${req.originalUrl} [${correlationId}]`
   );
   next();
});

// Routes
app.use("/", cartRoutes);

// Health Check
app.get("/health", (req, res) => {
   res.json({ status: "ok", service: "cart-service" });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
   console.log(` Cart Service running on http://localhost:${PORT}`);
});

// Triggering restart
