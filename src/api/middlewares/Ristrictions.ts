import { Request, Response, NextFunction } from "express";
import { Ristriction } from "../entity/ristrictions/Ristriction";
import { AppDataSource } from "@/server";

interface AuthenticatedRequest extends Request {
    userId: string;
}

export const restriction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId; 

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const restrictionRepo = AppDataSource.getRepository(Ristriction);
    const restriction = await restrictionRepo.findOne({ where: { userId } });

    if (!restriction) {
      return res.status(404).json({ error: "Restriction record not found" });
    }

    if (restriction.connectionCount <= 0) {
      return res.status(403).json({ status: "error", message: "We are currently verifying the profiles. Please wait 24h - 48h to resume sending the connection request." });
    }

    next(); 
  } catch (error) {
    console.error("Error checking connection limit:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
