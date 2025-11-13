import { Router } from "express";

const router = Router();

//temp stub route
router.get("/test", (_req, res) => {
  res.json({ ok: true, route: "auth/test" });
});

export default router;
