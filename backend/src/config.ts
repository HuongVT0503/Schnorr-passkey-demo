
import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}


function requireNumberEnv(name: string, fallback?: string): number {
  const str = process.env[name] ?? fallback;
  if (!str) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  const n = Number(str);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid numeric environment variable ${name}=${String(str)} — expected a positive integer (milliseconds)`);
  }
  return Math.floor(n);
}


export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  //placeholder for real DB
  rpId: requireEnv("RP_ID", "localhost"),
  frontendOrigin: requireEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
  sessionSecret: requireEnv("SESSION_SECRET"),
  //sessionLifetimeMs: Number(process.env.SESSION_LIFETIME_MS ?? 1000 * 60 * 60 * 24),   //1day
  // ensures sessionLifetimeMs is a valid positive integer (ms)
  sessionLifetimeMs: requireNumberEnv("SESSION_LIFETIME_MS", String(1000 * 60 * 60 * 24)),

   allowInsecureSignatures: process.env.ALLOW_INSECURE_SIGNATURES === "1",
   //true=1=server allows insecure signatures->JUST FOR TÉTING
};
