import { Connection } from "@/api/entity/connection/Connections";
import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { BlockedPost } from "@/api/entity/posts/BlockedPost";
import { BlockedUser } from "@/api/entity/posts/BlockedUser";
import { ReportedPost } from "@/api/entity/posts/ReportedPost";
import { ReportedUser } from "@/api/entity/posts/ReportedUser";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";

export const blockPost = async (req: Request, res: Response) => {
    try {
        const { userId, postId } = req.body;

        const blockedPostRepo = AppDataSource.getRepository(BlockedPost);
        const blockedPost = blockedPostRepo.create({
            blockedBy: userId,
            blockedPost: postId
        });
        await blockedPost.save();

        return res.status(200).json({ status: "success", message: "Post hidden succesfully" })
    } catch (err) {
        return res.status(500).json({ status: "error", message: "Error hidding post" })
    }
}
export const blockUser = async (req: Request, res: Response) => {
    try {
        const { userId, blockedUser, reason } = req.body;

        if (!userId || !blockedUser || !reason) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }

        const personalRepo = AppDataSource.getRepository(PersonalDetails);
        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);
        const connectionRepo = AppDataSource.getRepository(Connection);

        // Validate users exist
        const user = await personalRepo.findOne({ where: { id: userId } });
        const targetUser = await personalRepo.findOne({ where: { id: blockedUser } });

        if (!user || !targetUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        // Check if the users have a connection
        const connection = await connectionRepo.findOne({
            where: [
                { requesterId: userId, receiverId: blockedUser },
                { requesterId: blockedUser, receiverId: userId }
            ]
        });

        if (connection) {
            await connectionRepo.remove(connection); 
        }

        // Check if user is already blocked
        const existingBlock = await blockedUserRepo.findOne({
            where: { blockedBy: userId, blockedUser }
        });

        if (existingBlock) {
            return res.status(400).json({ status: "error", message: "User is already blocked" });
        }

        // Block user
        const blockEntry = blockedUserRepo.create({
            blockedBy: userId,
            blockedUser: blockedUser,
            reason
        });

        await blockedUserRepo.save(blockEntry);

        return res.status(200).json({ status: "success", message: "User blocked successfully" });
    } catch (err) {
        console.error("Error blocking user:", err);
        return res.status(500).json({ status: "error", message: "Error blocking user" });
    }
};

export const reportedUser = async (req: Request, res: Response) => {
    try {
        const { userId, reportedUser, reason, additionalComment } = req.body;

        const reportedUserRepo = AppDataSource.getRepository(ReportedUser);
        const reportUser = reportedUserRepo.create({
            ReportedBy: userId,
            ReportedUser: reportedUser,
            reason,
            additionalComment
        });
        await reportUser.save();

        return res.status(200).json({ status: "success", message: "reported user succesfully" })
    } catch (err) {
        return res.status(500).json({ status: "error", message: "Error reporting user" })
    }
}

export const reportedPost = async (req: Request, res: Response) => {
    try {
        const { userId, reportedPost, reason, additionalComment } = req.body;

        const reportedPostRepo = AppDataSource.getRepository(ReportedPost);
        const reportPost = reportedPostRepo.create({
            ReportedBy: userId,
            ReportedPost: reportedPost,
            reason,
            additionalComment
        });
        await reportPost.save();

        return res.status(200).json({ status: "success", message: "reported post succesfully" })
    } catch (err) {
        return res.status(500).json({ status: "error", message: "Error reporting post" })
    }
}