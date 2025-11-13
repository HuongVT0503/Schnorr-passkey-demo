import { Router } from "express";

const router = Router();

//temp stub protected route
router.get("/me", (_req, res) => {
  //authSession middleware n fetch user from DB
  res.json({ username: "demo", createdAt: new Date().toISOString() });
});

export default router;
