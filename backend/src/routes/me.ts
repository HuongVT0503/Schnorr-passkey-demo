import { Router } from "express";
import { prisma } from "../db/prisma";
import { authSession } from "../middleware/authSession";


const router = Router();

//get current user
router.get("/me", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, createdAt: true },
  });
  if (!u) return res.status(404).json({ error: "not found" });
  return res.json(u);
});
//fetch user from db'



//delete account
router.delete("/me", authSession, async (req, res) => {
  const userId = (req as any).userId as string;
  try{
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    //delete session first
  
  //clear cookie
  res.clearCookie("session",{path:"/"});
  return res.json({ ok: true, message: "account deleted"  });
  }
  catch(err){
    console.error(err);
    return res.status(500).json({ error: "failed to delete account" });
  }
});

export default router;
