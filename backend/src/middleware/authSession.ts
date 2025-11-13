import { Request, Response, NextFunction } from "express";
import { verifySession } from "../lib/session";

export async function authSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = (req as any).cookies?.session; //cookie-parser in app.ts
  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const userId = await verifySession(token);
  if (!userId) {
    return res.status(401).json({ error: "unauthorized" });
  }

  //attach to req (runtime only,TS can use any)
  (req as any).userId = userId;
  next();
}
