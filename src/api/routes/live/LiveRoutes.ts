import { Router } from "express";
import { generateToken, createRoom } from "@/api/controllers/live/TokenGenerator";

const router = Router();

router.post("/room", createRoom);
router.post("/token", generateToken);

export default router;