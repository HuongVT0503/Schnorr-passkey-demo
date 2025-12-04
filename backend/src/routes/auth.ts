//server route
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { createSession } from "../lib/session";
import { verifySchnorrSignature } from "../lib/schnorr";
import { createPending, consumePending } from "../lib/security";
import { config } from "../config";
import { ms } from "zod/v4/locales";

//Zod is a TypeScript-first validation library that allows you to define schemas for data validation, ensuring type safety and integrity in your applications.


const router = Router();


const usernameSchema = z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/, "invalid chars");


//register init
router.post("/register/init", async (req, res) => {
  const parsed = usernameSchema.safeParse(req.body.username);
  if (!parsed.success) return res.status(400).json({ error: "invalid username" });
  const username = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ error: "username taken" });

  // Use the username as userRef here; pending will contain the challenge and expiry
  const { id, challenge } = createPending(username);
  return res.json({ regId: id, rpId: config.rpId, challenge });
});


//register complete
router.post("/register/complete", async (req, res) => {
  const bodySchema = z.object({
    regId: z.string(),
    username: usernameSchema,
    pubKey: z.string(), //hex-encoded (validate length lightly)
    regSignature: z.string(),
    clientData: z.object({
      rpId: z.string(),
      challenge: z.string(),
    }),
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad request", details: parsed.error.format() });

  const { regId, username, pubKey, regSignature, clientData } = parsed.data;

  const pending = consumePending(regId);
  if (!pending || pending.userRef !== username)
    return res.status(400).json({ error: "invalid or expired registration" });

  if (clientData.challenge !== pending.challenge || clientData.rpId !== config.rpId) {
    return res.status(400).json({ error: "clientData mismatch" });
  }

  //verify signature (challenge + rpId encoded as bytes)
const msgBytes = new TextEncoder().encode(pending.challenge + clientData.rpId);
//const msgHex = Buffer.from(msgBytes).toString("hex"); // convert to hex string

  let ok = false;
  if (config.allowInsecureSignatures) {  //hehe
    ok = true;
  } else {
    try {
      ok = verifySchnorrSignature(pubKey, msgBytes, regSignature);//
    } catch (err) {
      ok = false;
    }
  }

  if (!ok) return res.status(400).json({ error: "invalid proof" });

  try {
    await prisma.user.create({ data: { username, pubKey } });
  } catch (err: any) {
    // race or uniqueness error
    return res.status(500).json({ error: "db error", detail: err.message });
  }

  return res.json({ ok: true });
});



//login init
router.post("/login/init", async (req, res) => {
  const parsed = usernameSchema.safeParse(req.body.username);
  if (!parsed.success) return res.status(400).json({ error: "invalid username" });
  const username = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(404).json({ error: "user not found" });

  const { id, challenge } = createPending(user.id); // store user.id as userRef
  return res.json({ loginId: id, challenge });
});




//login complete
router.post("/login/complete", async (req, res) => {
  const bodySchema = z.object({
    loginId: z.string(),
    username: usernameSchema,
    signature: z.string(),
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad request" });

  const { loginId, username, signature } = parsed.data;
  const pending = consumePending(loginId);
  if (!pending) return res.status(400).json({ error: "invalid or expired login" });

  const user = await prisma.user.findUnique({ where: { id: pending.userRef } });
  if (!user || user.username !== username) return res.status(400).json({ error: "user mismatch" });

const msgBytes = new TextEncoder().encode(pending.challenge + "auth" + config.rpId);
//const msgHex = Buffer.from(msgBytes).toString("hex");
  let ok = false;
  if (config.allowInsecureSignatures) {
    ok = true;
  } else {
    try {
      ok = verifySchnorrSignature(user.pubKey, msgBytes, signature);
    } catch {
      ok = false;
    }
  }

  if (!ok) return res.status(401).json({ error: "bad signature" });

  const token = await createSession(user.id);
  // secure cookie options: ensure secure:true in prod (https)
  res.cookie("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: config.sessionLifetimeMs,
  });

  return res.json({ ok: true });
});




//temp stub route
router.get("/test", (_req, res) => {
  res.json({ ok: true, route: "auth/test" });
});

export default router;

//usernameSchema restricts to [a-zA-Z0-9._-]
//screatePending store username or userid
