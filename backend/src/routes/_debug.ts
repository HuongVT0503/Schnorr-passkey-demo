
import { Router } from "express";
import { dumpPending } from "../lib/security"; // add dumpPending helper in security.ts

const router = Router();

router.get("/pending", (_req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(403).json({ error: "forbidden" });
  return res.json({ pending: dumpPending() });
});

export default router;

