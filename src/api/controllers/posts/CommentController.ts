import { Request, Response } from 'express';
import { Comment } from '../../entity/posts/Comment'; // Adjust the import path as needed
import { AppDataSource } from '@/server';
import { NestedComment } from '@/api/entity/posts/NestedComment';

export const createComment = async (req: Request, res: Response) => {
    try {
        const { userId, postId, text } = req.body;

        if (!userId || !postId || !text) {
            return res.status(400).json({ status: "error", message: 'userId, postId, and text are required.' });
        }

        const comment = Comment.create({
            userId,
            postId,
            text,
            createdBy: "system",
            updatedBy: "system",
        });

        await comment.save();

        return res.status(201).json({ status: "success", message: 'Comment created successfully.', data: { comment } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const { postId, page, limit = 5 } = req.body;

        const currentPage = page && page > 0 ? page : 1;
        const skip = (currentPage - 1) * limit;

        const commentRepository = AppDataSource.getRepository(Comment);

        if (!postId) {
            return res.status(400).json({ status: "error", message: 'postId is required.' });
        }

        const comments = await commentRepository.find({
            where: { postId },
            order: { createdAt: 'ASC' },
            take: limit,
            skip
        });

        return res.status(200).json({ status: "success", message: 'Comments fetched successfully.', data: { comments } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "success", message: 'Internal Server Error', error });
    }
};

export const createNestedComment = async (req: Request, res: Response) => {
    try {
        const { userId, postId, commentId, text, createdBy } = req.body;

        if (!userId || !postId || !text) {
            return res.status(400).json({ status: "error", message: 'userId, postId, and text are required.' });
        }

        const comment = NestedComment.create({
            userId,
            postId,
            commentId: commentId || null,
            text,
            createdBy: createdBy || 'system',
            updatedBy: createdBy || 'system',
        });

        await comment.save();

        return res.status(201).json({ status: "success", message: 'Comment created successfully.', data: { comment } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};

export const getNestedComments = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;

        if (!commentId) {
            return res.status(400).json({ status: "success", message: 'commentId is required.' });
        }

        const nestedCommentRepository = AppDataSource.getRepository(NestedComment);

        const nestedComments = await nestedCommentRepository.find({
            where: { commentId },
            order: { createdAt: 'ASC' },
        });

        return res
            .status(200)
            .json({ status: "success", message: 'Nested comments fetched successfully.', data: { nestedComments } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error });
    }
};

