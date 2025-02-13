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

        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);
        const blockUser = blockedUserRepo.create({
            blockedBy: userId,
            blockedUser: blockedUser,
            reason
        });
        await blockUser.save();

        return res.status(200).json({ status: "success", message: "User blocked succesfully" })
    } catch (err) {
        return res.status(500).json({ status: "error", message: "Error blocking user" })
    }
}

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