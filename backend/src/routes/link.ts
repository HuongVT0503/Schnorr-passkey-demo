import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { authSession } from "../middleware/authSession";
import { verifySchnorrSignature } from "../lib/schnorr";
import { config } from "../config";

const router = Router();

//GENERATE LINK (from main device/ first devuce/ nning device)
router.post("/init", authSession, async (req, res) => {
  const userId = (req as any).userId;

  //token for 5 min
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const link = await prisma.linkToken.create({
    data: { userId, expiresAt },
  });

  //full url
  const url = `${config.frontendOrigin}/connect-device?linkId=${link.id}`;
  return res.json({ url, expiresAt });
});

//GET LINK INFO (from new device when opening the link)
router.get("/info/:linkId", async (req, res) => {
  const { linkId } = req.params;

  const link = await prisma.linkToken.findUnique({
    where: { id: linkId },
    include: { user: { select: { username: true } } },
  });

  if (!link || link.expiresAt < new Date()) {
    return res.status(404).json({ error: "Link expired or invalid" });
  }

  //send rand challenge to new device
  const challenge = await import("../lib/security").then((m) =>
    m.generateChallenge()
  );

  await prisma.linkToken.update({
    where: { id: linkId },
    data: { challenge },
  });

  return res.json({
    username: link.user.username,
    challenge,
    rpId: config.rpId,
  });
});

//COMPLETE LINK (from new device: send new key + sig)
router.post("/complete", async (req, res) => {
  const schema = z.object({
    linkId: z.string(),
    newPubKey: z.string(),
    signature: z.string(),
    deviceName: z.string().optional(),
    challenge: z.string(), //the challenge received in priv step
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Bad request" });

  const { linkId, newPubKey, signature, deviceName } = parsed.data;

  //immeately delete link
  let link;
  try {
    link = await prisma.linkToken.delete({
      where: { id: linkId },
    });
  } catch (err) {
    // P2025 (Prisma): Record to delete does not exist
    return res
      .status(400)
      .json({ error: "Link expired, invalid, or already used." });
  }

  if (!link || link.expiresAt < new Date()) {
    return res.status(400).json({ error: "Link expired" });
  }
  if (!link.challenge) {
    return res
      .status(400)
      .json({ error: "Link flow invalid (no challenge set)" });
  }

  //Verify Signature: new device signs (Challenge + linkId)
  //linkId included to bind the sig to this transaction
  const msgStr = link.challenge + linkId;
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
    },
  });

  return res.json({ ok: true });
});

export default router;
