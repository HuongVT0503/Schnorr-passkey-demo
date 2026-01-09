
import { dot } from "node:test/reporters";
import app from "./app";
import { config } from "./config";
import { prisma } from "./db/prisma";

//clean any acc after 72h from registering point
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60 ;//check every 1h

async function cleanup() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 3* 24 * 60 * 60 * 1000);

  try{
    
    const {count} = await prisma.user.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
    if (count>0){
      console.log(`Deleted ${count} users`);
    }
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
