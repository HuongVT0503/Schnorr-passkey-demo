import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { authSession } from "../middleware/authSession";
import { verifySchnorrSignature } from "../lib/schnorr";
import { config } from "../config";
import { randomBytes } from "crypto";

const router = Router();

//GENERATE LINK (from main device/ first devuce/ nning device)
router.post("/init", authSession, async (req, res) => {
  const userId = (req as any).userId;

  //token for 5 min
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const token = randomBytes(32).toString("hex");

  const link = await prisma.linkToken.create({
    data: { userId, expiresAt, token },
  });

  //full url
  const url = `${config.frontendOrigin}/connect-device?token=${token}`;
  return res.json({ url, linkId: link.id,  expiresAt });
});

//GET LINK INFO (from new device when opening the link)
router.get("/info/:token", async (req, res) => {
  const { token } = req.params;

  const link = await prisma.linkToken.findUnique({
    where: { token },
    include: { user: { select: { username: true, salt: true } } },
  });

  if (!link || link.expiresAt < new Date()) {
    return res.status(404).json({ error: "Link expired or invalid" });
  }

  //send rand challenge to new device
  const challenge = await import("../lib/security.js").then((m) =>
    m.generateChallenge()
  );

  await prisma.linkToken.update({
    where: { id: link.id }, 
    data: { challenge },
  });

  return res.json({
    username: link.user.username,
    challenge,
    salt: link.user.salt,
    rpId: config.rpId,
  });
});

//COMPLETE LINK (from new device: send new key + sig)
router.post("/complete", async (req, res) => {
  const schema = z.object({
    token: z.string(),
    newPubKey: z.string(),
    signature: z.string(),
    deviceName: z.string().optional(),
    challenge: z.string(), //the challenge received in priv step
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Bad request" });

  const { token, newPubKey, signature, deviceName } = parsed.data;

  //immeately delete link
  // let link;
  // try {
  //   link = await prisma.linkToken.delete({
  //     where: { id: linkId },
  //   });
  // } catch (err) {
  //   // P2025 (Prisma): Record to delete does not exist
  //   return res
  //     .status(400)
  //     .json({ error: "Link expired, invalid, or already used." });
  // }
  const link = await prisma.linkToken.findUnique({
    where: { token },
  });

  if (!link || link.expiresAt < new Date()) {
    return res.status(400).json({ error: "Link expired or invalid" });
  }
  if (!link.challenge) {
    return res
      .status(400)
      .json({ error: "Link flow invalid (no challenge set)" });
  }

  //Verify Signature: new device signs (Challenge + token)
  //token included to bind the sig to this transaction // swapping attack
  const msgStr = link.challenge + token;
  const msgBytes = new TextEncoder().encode(msgStr);

  let ok = false;
  if (config.allowInsecureSignatures) {
    ok = true;
  } else {
    try {
      ok = await verifySchnorrSignature(newPubKey, msgBytes, signature);
    } catch (e) {
      ok = false;
    }
  }

  if (!ok) return res.status(400).json({ error: "Invalid signature" });

  //save new device
  await prisma.device.create({
    data: {
      userId: link.userId,
      pubKey: newPubKey,
      name: deviceName || "Backup Device",
      status: "PENDING",
    },
  });

  return res.json({ ok: true });
});

router.get("/status/:linkId", authSession, async (req, res) => {
  const { linkId } = req.params;
  const userId = (req as any).userId;

  if (!linkId) {
    return res.status(400).json({ error: "Missing linkId parameter" });
  }

  const link = await prisma.linkToken.findUnique({ where: { id: linkId } });
  if (!link || link.userId !== userId)
    return res.status(404).json({ error: "Link not found" });

  const pendingDevice = await prisma.device.findFirst({
    where: {
      userId,
      status: "PENDING",
      createdAt: { gt: link.createdAt },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pendingDevice) {
    return res.json({ status: "waiting" });
  }

  return res.json({
    status: "needs_approval",
    device: {
      id: pendingDevice.id,
      name: pendingDevice.name,
      pubKey: pendingDevice.pubKey,
    },
  });
});

//approval
router.post("/approve", authSession, async (req, res) => {
  const schema = z.object({
    deviceId: z.string(),
    linkId: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Bad Request" });
  const { deviceId, linkId } = parsed.data;
  const userId = (req as any).userId;

  //activate device
  const update = await prisma.device.updateMany({
    where: { id: deviceId, userId, status: "PENDING" },
    data: { status: "ACTIVE" },
  });

  if (update.count === 0)
    return res
      .status(404)
      .json({ error: "Device not found or already active" });

  //delete link after approval
  await prisma.linkToken.deleteMany({ where: { id: linkId } });

  return res.json({ ok: true });
});

export default router;
