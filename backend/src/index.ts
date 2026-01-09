import { dot } from "node:test/reporters";
import app from "./app";
import { config } from "./config";
import { prisma } from "./db/prisma";

//clean any acc after 72h from registering point
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60; //check every 1h

async function cleanup() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  try {
    const users = await prisma.user.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
    if (users.count > 0) {
      console.log(`Deleted ${users.count} users`);
    }

    const challenges = await prisma.authChallenge.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    if (challenges.count > 0)
      console.log(`Deleted ${challenges.count} expired challenges`);
  } catch (err) {
    console.error("Cleanup failed", err);
  }
}

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`); //4000

  //run immediate cleanup
  cleanup();

  setInterval(cleanup, CLEANUP_INTERVAL_MS);
});
