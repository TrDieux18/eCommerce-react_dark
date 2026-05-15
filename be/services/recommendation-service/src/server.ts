import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import recommendationRoutes from "./routes/index";

dotenv.config({ quiet: true } as any);

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging with Correlation ID
app.use((req, res, next) => {
   const correlationId = req.headers["x-correlation-id"] || "N/A";
   console.log(
      `[Recommendation Service] ${req.method} ${req.originalUrl} [${correlationId}]`
   );
   next();
});

// Routes
app.use("/", recommendationRoutes);

// Health Check
app.get("/health", (req, res) => {
   res.json({ status: "ok", service: "recommendation-service" });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
   console.log(
      `Recommendation Service running on http://localhost:${PORT}`
   );
});
