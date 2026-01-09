//challenge + rpId
//pendning map
import { randomBytes } from "crypto";
import { prisma } from "../db/prisma";

export function generateChallenge(): string {
  //32 bytes to 64 hex chars
  return randomBytes(32).toString("hex");
}

type PendingRecord = {
  userRef: string;
  challenge: string; // hex string
  salt: string | null;
  exp: number; // timestamp (ms)
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000; //5min
//const store = new Map<string, PendingRecord>();

//Create a new pending challenge record (for register or login).
//userRef: username or userId
//registration: username
//login: userId
export async function createPending(
  userRef: string,
  salt?: string
): Promise<{ id: string; challenge: string }> {
  const id = randomBytes(16).toString("hex");
  const challenge = generateChallenge();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

  await prisma.authChallenge.create({
    data: {
      id,
      userRef,
      challenge,
      salt: salt ?? null,
      expiresAt,
    },
  });

  return { id, challenge };
}

//consume a pending challenge by id (SINGLE-USE)
//null if not found or expired
export async function consumePending(
  id: string
): Promise<PendingRecord | null> {
  try {
    //retrieve then delete
    const record = await prisma.authChallenge.delete({
      where: { id },
    });
    if (record.expiresAt < new Date()) {
      return null;
    }
    return {
      userRef: record.userRef,
      challenge: record.challenge,
      salt: record.salt,
      exp: record.expiresAt.getTime(),
    };
  } catch (err) {
    return null;
  }
}
//return a snapshot of current pending entries /for debug
export async function dumpPending() {
  const records = await prisma.authChallenge.findMany();
  return records.map((p) => ({
    id: p.id,
    userRef: p.userRef,
    challenge: p.challenge,
    expiresAt: p.expiresAt.toISOString(),
    expired: p.expiresAt < new Date(),
  }));
}

//In /register/init:    createPending(username)
//In /register/complete: consumePending(regId)
//In /login/init:          createPending(user.id)
//In /login/complete:      consumePending(loginId)
//
