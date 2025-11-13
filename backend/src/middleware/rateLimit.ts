import { rateLimit } from "express-rate-limit";

//global api limit
//vi du 300 requests / 5min per IP
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, //5miin
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});


//auth limit 30 req/1min per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});
