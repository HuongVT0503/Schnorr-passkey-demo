import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { config } from "../config";
import { Session } from "@prisma/client";

type SessionPayload = {
  //from db, jwt payload
  sid: string; //Session.id
  uid: string; // User.id
};

//create a db backed session
//return a signed jwt token
//the token is what putted in "session" cookie
export async function createSession(
  userId: string,
  deviceId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const now = new Date();
  //ensure sessionLifetimeMs valid
  if (
    !Number.isFinite(config.sessionLifetimeMs) ||
    config.sessionLifetimeMs <= 0
  ) {
    throw new Error(
      "Invalid config.sessionLifetimeMs; must be positive integer (ms)"
    );
  }

  const expiresAt = new Date(now.getTime() + config.sessionLifetimeMs);

  const session = await prisma.session.create({
    data: {
      userId,
      deviceId,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  const payload: SessionPayload = {
    sid: session.id,
    uid: userId,
  };

  const token = jwt.sign(payload, config.sessionSecret, {
    expiresIn: Math.floor(config.sessionLifetimeMs / 1000), //sec
  });

  return token;
}

//check if the token is valid
export async function verifySession(token: string): Promise<Session | null> {
  try {
    const decoded = jwt.verify(token, config.sessionSecret) as SessionPayload;

    const session = await prisma.session.findUnique({
      where: { id: decoded.sid },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) return null;

    return session;
  } catch (err) {
    return null;
  }
}
