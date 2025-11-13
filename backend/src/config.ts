
import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  // For now, these are placeholders; will be used later in auth logic
  rpId: requireEnv("RP_ID", "localhost"),
  frontendOrigin: requireEnv("FRONTEND_ORIGIN", "http://localhost:5173")
};
