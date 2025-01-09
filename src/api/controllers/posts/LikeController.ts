import { Request, Response } from 'express';
import { Like } from '../../entity/posts/Like';
import { AppDataSource } from '@/server';
import { CommentLike } from '@/api/entity/posts/CommentLike';

export const createLike = async (req: Request, res: Response) => {
    try {
        const { userId, postId, status } = req.body;
        if (!userId || !postId) {
            return res.status(400).json({ status: "error", message: 'userId and postId are required.' });
        }
        const likeRepository = AppDataSource.getRepository(Like);
        let like = await likeRepository.findOne({ where: { userId, postId } });

        if (like) {
            like.status = status;
        } else {
            like = Like.create({
                userId,
                postId,
                status
            });
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
            return res.status(400).json({ status: "error", message: 'postId is required.' });
        }

        const likeRepository = AppDataSource.getRepository(Like);

        const likes = await likeRepository.find({ where: { postId } });

        return res.status(200).json({ status: "success", message: 'Likes fetched successfully.', data: { likes } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};

export const createCommentLike = async (req: Request, res: Response) => {
    try {
        const { userId, postId, commentId, status } = req.body;
        if (!userId || !postId || !commentId) {
            return res.status(400).json({ status: "error", message: 'userId, postId and commentId are required.' });
        }
        const commentLikeRepository = AppDataSource.getRepository(CommentLike);
        let like = await commentLikeRepository.findOne({ where: { userId, postId, commentId } });

        if (like) {
            like.status = status;
        } else {
            like = CommentLike.create({
                userId,
                postId,
                commentId,
                status
            });
        }
        await like.save();
        return res.status(200).json({ status: "success", message: 'commment Like status updated.', data: { like } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};

export const getAllLikesForComment = async (req: Request, res: Response) => {
    try {
        const { postId, commentId } = req.body;

        if (!postId) {
            return res.status(400).json({ status: "error", message: 'postId is required.' });
        }

        const commentLikeRepository = AppDataSource.getRepository(CommentLike);


        const likes = await commentLikeRepository.find({ where: { postId, commentId } });

        return res.status(200).json({ status: "success", message: 'Likes fetched successfully.', data: { likes } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};
