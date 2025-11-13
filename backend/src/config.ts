
import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  //placeholder for real DB
  rpId: requireEnv("RP_ID", "localhost"),
  frontendOrigin: requireEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
  sessionSecret: requireEnv("SESSION_SECRET"),
  sessionLifetimeMs: 1000 * 60 * 60 * 24,   //1day
};
