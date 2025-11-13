import express from "express";
import helmet from "helmet";
import cors from "cors"; //npm install -D @types/cors
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { config } from "./config";

const app = express();

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
const apiLimiter = rateLimit({
  windowMs: 60_000,           //1min
  max: 100
});
app.use("/api", apiLimiter);

//healthcheck endpoint
app.get("/api/health", (_req, res) => {  //!
  res.json({ ok: true, service: "schnorr-passkey-backend" });  //
});

//fallback 404 if unknown /api routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
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
