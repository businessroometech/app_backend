import { BlockedPost } from "@/api/entity/posts/BlockedPost";
import { BlockedUser } from "@/api/entity/posts/BlockedUser";
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
        const { userId, blockedUser } = req.body;

        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);
        const blockUser = blockedUserRepo.create({
            blockedBy: userId,
            blockedUser: blockedUser
        });
        await blockUser.save();

        return res.status(200).json({ status: "success", message: "User blocked succesfully" })
    } catch (err) {
        return res.status(500).json({ status: "error", message: "Error blocking user" })
    }
}