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

  const session = await verifySession(token);
  if (!session) {
    return res.status(401).json({ error: "unauthorized" });
  }

  ///////hijacking protection
  const currentIp = req.ip;
  const currentUserAgent = req.get("User-Agent");

  //check IP
  if (session.ipAddress && session.ipAddress !== currentIp) {
    console.warn(
      `Security: IP Mismatch for user ${session.userId}. Session: ${session.ipAddress}, Req: ${currentIp}`
    );
    return res
      .status(403)
      .json({ error: "Session invalid (IP Address changed)" });
  }

  //check user agent
  if (session.userAgent && session.userAgent !== currentUserAgent) {
    console.warn(
      `Security: UA Mismatch. Session: ${session.userAgent}, Req: ${currentUserAgent}`
    );
    return res.status(403).json({ error: "Session invalid (Browser changed)" });
  }
  ////

  //attach to req (runtime only,TS can use any)
  (req as any).userId = session.userId;
  next();
}
