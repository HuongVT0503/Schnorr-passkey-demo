import { Router } from "express";
import { prisma } from "../db/prisma";
import { authSession } from "../middleware/authSession";


const router = Router();

router.get("/me", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, createdAt: true },
  });
  if (!u) return res.status(404).json({ error: "not found" });
  return res.json(u);
});
//fetch user from db

export default router;
