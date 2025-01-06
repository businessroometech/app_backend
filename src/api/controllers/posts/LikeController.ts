import { Request, Response } from 'express';
import { Like } from '../../entity/posts/Like';
import { AppDataSource } from '@/server';

export const createOrToggleLike = async (req: Request, res: Response) => {
    try {
        const { userId, postId } = req.body;

        const likeRepository = AppDataSource.getRepository(Like);

        if (!userId || !postId) {
            return res.status(400).json({ status: "error", message: 'userId and postId are required.' });
        }

        let like = await likeRepository.findOne({ where: { userId, postId } });

        if (!like) {
            like = Like.create({
                userId,
                postId,
                status: true,
                createdBy: "system",
                updatedBy: "system",
            });
        } else {
            like.status = !like.status;
            like.updatedBy = userId;
        }

        await like.save();
        return res.status(200).json({ status: "success", message: 'Like status updated.', data: { like } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};

export const getAllLikesForPost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ status:"error", message: 'postId is required.' });
        }

        const likes = await Like.find({ where: { postId } });

        return res.status(200).json({ status: "success", message: 'Likes fetched successfully.', data: { likes } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};
