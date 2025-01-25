import { Router } from "express";
import { getTokenForBroadcastingAndViewing } from "@/api/controllers/live/TokenGenerator";

const router = Router();

router.post("/token", getTokenForBroadcastingAndViewing);

export default router;