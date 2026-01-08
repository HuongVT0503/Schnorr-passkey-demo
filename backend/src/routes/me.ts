import { Router } from "express";
import { prisma } from "../db/prisma";
import { authSession } from "../middleware/authSession";

const router = Router();

//get current user
router.get("/me", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, createdAt: true },
  });
  if (!u) return res.status(404).json({ error: "not found" });
  return res.json(u);
});
//fetch user from db'

router.get("/me/devices", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
    return res.json({ devices });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch devices" });
  }
});

router.delete("/me/devices/:id", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  const deviceId = req.params.id;

  if (!deviceId) {
    return res.status(400).json({ error: "Device ID is required" });
  }

  try {
    //deleteMany -> only delete if it belongs to authenticated user
    const { count } = await prisma.device.deleteMany({
      where: {
        id: deviceId,
        userId: userId,
      },
    });

    if (count === 0) {
      return res
        .status(404)
        .json({ error: "Device not found or not authorized" });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete device" });
  }
});

//delete account
router.delete("/me", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    //delete session first

    //clear cookie
    res.clearCookie("session", { path: "/" });
    return res.json({ ok: true, message: "account deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed to delete account" });
  }
});

export default router;
