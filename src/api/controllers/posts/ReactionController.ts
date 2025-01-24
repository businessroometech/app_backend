import { Request, Response } from 'express';
import { Reaction } from '@/api/entity/posts/Reaction';
import { UserPost } from '@/api/entity/UserPost';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { AppDataSource } from '@/server';

// Create or Update Reaction
export const createOrUpdateReaction = async (req: Request, res: Response) => {
    try {
        const { userId, postId, reactionType } = req.body;

        // Validate required fields
        if (!userId || !postId) {
            return res.status(400).json({
                status: "error",
                message: "userId and postId are required.",
            });
        }

        // Find the user
        const user = await PersonalDetails.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found.",
            });
        }

        // Check if the post exists
        const post = await UserPost.findOne({ where: {  Id: postId } });
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "Post not found.",
            });
        }

        // Repository for Reaction entity
        const reactionRepository = AppDataSource.getRepository(Reaction);

        // Find if the reaction already exists
        let reaction = await reactionRepository.findOne({
            where: {   user: { id: userId },
                 post: { Id: postId }}
        });

        if (reaction) {
            // Update the existing reaction
            reaction.reactionType = reactionType || reaction.reactionType;
            await reactionRepository.save(reaction);
            return res.status(200).json({
                status: "success",
                message: "Reaction updated successfully.",
            });
        }

        // Create a new reaction
        reaction = reactionRepository.create({
            user,
            post,
            reactionType: reactionType 
        });

        await reactionRepository.save(reaction);

        return res.status(201).json({
            status: "success",
            message: "Reaction created successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Something went wrong.",
            error: (error as Error).message,
        });
    }
};

// Remove Reaction
export const removeReaction = async (req: Request, res: Response) => {
    try {
        const { userId, postId } = req.body;
        if (!userId || !postId) {
            return res.status(400).json({ status: "error", message: 'userId and postId are required.' });
        }

        
        // Check if the post exists
        const post = await UserPost.findOne({ where: {  Id: postId } });
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "Post not found.",
            });
        }


        const reactionRepos = AppDataSource.getRepository(Reaction)
         let reaction = await reactionRepos.findOne({
            where: {   user: { id: userId },
                 post: { Id: postId }}
        });

        if (!reaction) {
            return res.status(404).json({ status: "error", message: 'Reaction not found.' });
        }
        await reaction.remove();

        return res.status(200).json({ status: "success", message: 'Reaction removed successfully.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Something went wrong.', error: (error as Error).message });
    }
};
