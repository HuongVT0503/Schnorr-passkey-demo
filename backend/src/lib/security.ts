//challenge + rpId 
//pendning map
import { randomBytes } from "crypto";

export function generateChallenge(): string {
  //32 bytes to 64 hex chars
  return randomBytes(32).toString("hex");
}

type PendingRecord = {
  userRef: string;     
  challenge: string; // hex string
  exp: number;       // timestamp (ms)
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000;       //5min
const store = new Map<string, PendingRecord>();


//Create a new pending challenge record (for register or login).
//userRef: username or userId
//registration: username
//login: userId
export function createPending(userRef: string): {
  id: string;
  challenge: string;
} {
  const id = randomBytes(16).toString("hex");
  const challenge = generateChallenge();

  store.set(id, {
    userRef,
    challenge,
    exp: Date.now() + CHALLENGE_TTL_MS,
  });

  return { id, challenge };
}


//consume a pending challenge by id (SINGLE-USE)
//null if not found or expired
export function consumePending(id: string): PendingRecord | null {
  const rec = store.get(id);
  if (!rec) return null;

  //always delete
  store.delete(id);

  if (rec.exp < Date.now()) {
    return null;
  }

  return rec;
}

//In /register/init:    createPending(username)
//In /register/complete: consumePending(regId)
//In /login/init:          createPending(user.id)
//In /login/complete:      consumePending(loginId)