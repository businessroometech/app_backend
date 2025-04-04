import express from "express";
import { postUserActivity } from "../../controllers/UserActivity/userActivity";

const router = express.Router();

router.post("/user", postUserActivity);

export default router;