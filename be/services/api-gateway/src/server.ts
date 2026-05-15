import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ quiet: true } as any);

const app = express();


app.use(
   cors({
      origin: process.env.ORIGIN_URL || "http://localhost:5173",
      credentials: true,
   })
);
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Correlation ID — mỗi request được gán 1 ID duy nhất để tracing
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
   const correlationId =
      (req.headers["x-correlation-id"] as string) || uuidv4();
   req.headers["x-correlation-id"] = correlationId;
   res.setHeader("x-correlation-id", correlationId);
   next();
});

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
   console.log(
      `[Gateway] ${req.method} ${req.originalUrl} [correlationId: ${req.headers["x-correlation-id"]}]`
   );
   next();
});

// ---------------------------------------------------------------------------
// Service URLs
// ---------------------------------------------------------------------------
const USER_SERVICE =
   process.env.USER_SERVICE_URL || "http://localhost:3001";
const PRODUCT_SERVICE =
   process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
const CART_SERVICE =
   process.env.CART_SERVICE_URL || "http://localhost:3003";
const ORDER_SERVICE =
   process.env.ORDER_SERVICE_URL || "http://localhost:3004";
const RECOMMENDATION_SERVICE =
   process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:3005";

// ---------------------------------------------------------------------------
// Proxy helpers
// ---------------------------------------------------------------------------
const proxyOptions = (target: string): Options => ({
   target,
   changeOrigin: true,
   on: {
      proxyReq: (proxyReq, req) => {
         // Propagate correlation ID to downstream services
         const correlationId = req.headers["x-correlation-id"];
         if (correlationId) {
            proxyReq.setHeader(
               "x-correlation-id",
               correlationId as string
            );
         }
      },
      error: (err, req, res) => {
         console.error(`[Gateway] Proxy error: ${err.message}`);
         if ("writeHead" in res && typeof res.writeHead === "function") {
            (res as any).writeHead(502);
            (res as any).end(
               JSON.stringify({
                  success: false,
                  message: `Service unavailable: ${err.message}`,
               })
            );
         }
      },
   },
});



// Create proxies
const userProxy = createProxyMiddleware(proxyOptions(USER_SERVICE));
const productProxy = createProxyMiddleware(proxyOptions(PRODUCT_SERVICE));
const cartProxy = createProxyMiddleware(proxyOptions(CART_SERVICE));
const orderProxy = createProxyMiddleware(proxyOptions(ORDER_SERVICE));
const recommendationProxy = createProxyMiddleware(proxyOptions(RECOMMENDATION_SERVICE));

app.use((req, res, next) => {
   const p = req.path;
   
   // Auth & Profile & Admin Users → User Service
   if (p.startsWith("/login") || p.startsWith("/register") || p.startsWith("/profile") || p.startsWith("/admin/users")) {
      return userProxy(req, res, next);
   }
   
   // Products & Admin Products → Product Service
   if (p.startsWith("/products") || p.startsWith("/admin/products")) {
      return productProxy(req, res, next);
   }
   
   // Cart → Cart Service
   if (p.startsWith("/cart")) {
      return cartProxy(req, res, next);
   }
   
   // Invoices & Admin Invoices → Order Service
   if (p.startsWith("/invoices") || p.startsWith("/admin/invoices")) {
      return orderProxy(req, res, next);
   }
   
   // Recommendations → Recommendation Service
   if (p.startsWith("/recommendations")) {
      return recommendationProxy(req, res, next);
   }
   
   next();
});

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get("/health", (req, res) => {
   res.json({
      status: "ok",
      service: "api-gateway",
      timestamp: new Date().toISOString(),
      downstream: {
         "user-service": USER_SERVICE,
         "product-service": PRODUCT_SERVICE,
         "cart-service": CART_SERVICE,
         "order-service": ORDER_SERVICE,
         "recommendation-service": RECOMMENDATION_SERVICE,
      },
   });
});

app.get("/", (req, res) => {
   res.send("API Gateway — SOA E-commerce Backend");
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`API Gateway running on http://localhost:${PORT}`);
   console.log(`   → User Service:           ${USER_SERVICE}`);
   console.log(`   → Product Service:        ${PRODUCT_SERVICE}`);
   console.log(`   → Cart Service:           ${CART_SERVICE}`);
   console.log(`   → Order Service:          ${ORDER_SERVICE}`);
   console.log(`   → Recommendation Service: ${RECOMMENDATION_SERVICE}`);
});
