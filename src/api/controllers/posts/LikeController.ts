import { Request, Response } from 'express';
import { Like } from '../../entity/posts/Like';
import { AppDataSource } from '@/server';
import { CommentLike } from '@/api/entity/posts/CommentLike';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { UserPost } from '@/api/entity/UserPost';
import { sendNotification, WebSocketNotification } from '../notifications/SocketNotificationController';
import { generatePresignedUrl } from '../s3/awsControllers';

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

         // Get the post and user information
    const postRepo = AppDataSource.getRepository(UserPost);
    const userPost = await postRepo.findOne({ where: { id: postId } });
    
    if (!userPost) {
      return res.status(404).json({
        status: "error",
        message: 'Post not found.',
      });
    }

    
    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    const userInfo = await personalRepo.findOne({ where: { id: userPost.userId } });
    const commenterInfo = await personalRepo.findOne({ where: { id: userId } });

    if (!userInfo || !commenterInfo) {
      return res.status(404).json({
        status: "error",
        message: 'User information not found.',
      });
    }

    const media =  commenterInfo.profilePictureUploadId ? commenterInfo.profilePictureUploadId:null
    let notification =  await  sendNotification(userInfo.id, `${commenterInfo.firstName} ${commenterInfo.lastName} liked your post.`,media, `/feed/home#${postId}`)
    if(userInfo.id ===userId){
        return   res.status(200).json({ status: "success", message: 'Like status updated.', data: { like } });
    }
    if(notification){
        return res.status(200).json({ status: "success", message: 'Like status updated.', data: { like , notification}})
    }
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
            return res.status(400).json({ status: "error", message: 'userId, postId, and commentId are required.' });
        }

        const commentLikeRepository = AppDataSource.getRepository(CommentLike);

        let like = await commentLikeRepository.findOne({ where: { userId, postId, commentId } });

        if (like) {
            like.status = status;
        } else {
            like = commentLikeRepository.create({
                userId,
                postId,
                commentId,
                status,
            });
        }

        await commentLikeRepository.save(like);

            // Get the post and user information
    const postRepo = AppDataSource.getRepository(UserPost);
    const userPost = await postRepo.findOne({ where: { id: postId } });
    
    if (!userPost) {
      return res.status(404).json({
        status: "error",
        message: 'Post not found.',
      });
    }

    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    const userInfo = await personalRepo.findOne({ where: { id: userPost.userId } });
    const commenterInfo = await personalRepo.findOne({ where: { id: userId } });

    if (!userInfo || !commenterInfo) {
      return res.status(404).json({
        status: "error",
        message: 'User information not found.',
      });
    }

    // Create a notification
    const notificationRepo = AppDataSource.getRepository(Notifications);
    const notification = notificationRepo.create({
      userId: userInfo.id,
      message: `${commenterInfo.firstName} ${commenterInfo.lastName} Like your comment`,
      navigation: `/feed/home#${postId}`,
    });

    // Save the notification
    await notificationRepo.save(notification);


        return res.status(200).json({ status: "success", message: 'Comment Like status updated.', data: { like } });
    } catch (error: any) {
        console.error('Error details:', error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error', error: error.message });
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
