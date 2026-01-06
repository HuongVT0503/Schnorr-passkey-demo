import express from "express";
import helmet from "helmet";
import cors from "cors"; //npm install -D @types/cors
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { config } from "./config";

import { prisma } from "./db/prisma";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import debugRoutes from "./routes/_debug";

import { apiLimiter, authLimiter } from "./middleware/rateLimit";
import path from "path";

const app = express();

app.set("trust proxy", 1); //trust first proxy (railways load balancer) 

//security headers
app.use(helmet());

//CORS: allow my frontend origin //adjust
app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true
  })
);

//middleware
app.use(express.json());
app.use(cookieParser());

//rate limiting for ALL API routes

// const apiLimiter = rateLimit({
//   windowMs: 60_000,           //1min
//   max: 100
// });
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
//me/protected routes
app.use("/api", meRoutes);
//debug
//app.use("/_debug", debugRoutes);
if (process.env.NODE_ENV !== "production") {
  app.use("/_debug", debugRoutes);
}

//healthcheck endpoint
// app.get("/api/health", (_req, res) => {  //!
//   res.json({ ok: true, service: "schnorr-passkey-backend" });  //
// });

//db check
// app.get("/api/db-check", async (_req, res) => {
//   try {
//     const userCount = await prisma.user.count();
//     res.json({ ok: true, userCount });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ ok: false, error: "DB error" });
//   }
// });


//fallback 404 if unknown /api routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});


//serve static files from fe build folder, 
//point to fe build folder
const frontendPath = path.join(__dirname, "../public");
app.use(express.static(frontendPath));

//catch all
// for requests not handled by /api, send index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});



//error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;
