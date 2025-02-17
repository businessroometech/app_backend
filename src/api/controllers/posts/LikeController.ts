import { Request, Response } from 'express';
import { Like } from '../../entity/posts/Like';
import { AppDataSource } from '@/server';
import { CommentLike } from '@/api/entity/posts/CommentLike';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { UserPost } from '@/api/entity/UserPost';
import { sendNotification } from '../notifications/SocketNotificationController';
import { generatePresignedUrl } from '../s3/awsControllers';
import { In } from 'typeorm';
import { Comment } from '@/api/entity/posts/Comment';

export const createLike = async (req: Request, res: Response) => {
  try {
    const { userId, postId, status, reactionId } = req.body;
    if (!userId || !postId) {
      return res.status(400).json({ status: 'error', message: 'userId and postId are required.' });
    }
    const likeRepository = AppDataSource.getRepository(Like);
    let like = await likeRepository.findOne({ where: { userId, postId } });

    if (like) {
      like.status = status;
      like.reactionId = reactionId;
    } else {
      like = Like.create({
        userId,
        postId,
        status,
        reactionId
      });
    }
    await like.save();

    // Get the post and user information
    const postRepo = AppDataSource.getRepository(UserPost);
    const userPost = await postRepo.findOne({ where: { id: postId } });

    if (!userPost) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    const userInfo = await personalRepo.findOne({ where: { id: userPost.userId } });
    const commenterInfo = await personalRepo.findOne({ where: { id: userId } });

    if (!userInfo || !commenterInfo) {
      return res.status(404).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    const media = commenterInfo.profilePictureUploadId ? commenterInfo.profilePictureUploadId : null;

    let notifications = null;

    if (userInfo.id !== userId && status === true) {
      notifications = await sendNotification(
        userInfo.id,
        `${commenterInfo.firstName} ${commenterInfo.lastName} liked your post.`,
        media,
        `/feed/post/${postId}`
      );
    }

    return res.status(200).json({ status: 'success', message: 'Like status updated.', data: { like, notifications } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

export const getAllLikesForPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }

    const likeRepository = AppDataSource.getRepository(Like);
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);

    // Fetch likes for the given post
    const likes = await likeRepository.find({
      where: { postId, status: true },
    });

    // Fetch user details for each like
    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await personalDetailsRepository.findOne({ where: { id: like.userId } });

        return {
          ...like,
          user: user
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      message: 'Likes fetched successfully.',
      data: { likes: likesWithUsers },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};


export const createCommentLike = async (req: Request, res: Response) => {
  try {
    const { userId, postId, commentId, status } = req.body;
    if (!userId || !postId || !commentId) {
      return res.status(400).json({ status: 'error', message: 'userId, postId, and commentId are required.' });
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
        status: 'error',
        message: 'Post not found.',
      });
    }

    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    const userInfo = await personalRepo.findOne({ where: { id: userPost.userId } });
    const commenterInfo = await personalRepo.findOne({ where: { id: userId } });

    if (!userInfo || !commenterInfo) {
      return res.status(404).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    // Create a notification
    if (commenterInfo.id !== userInfo.id && status === true) {
      await sendNotification(
        userInfo.id,
        `${commenterInfo.firstName} ${commenterInfo.lastName} Like your comment`,
        commenterInfo.profilePictureUploadId,
        `/feed/post/${userPost.id}`
      );
    }

    return res.status(200).json({ status: 'success', message: 'Comment Like status updated.', data: { like } });
  } catch (error: any) {
    console.error('Error details:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error: error.message });
  }
};

export const getAllLikesForComment = async (req: Request, res: Response) => {
  try {
    const { postId, commentId } = req.body;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }

    const commentLikeRepository = AppDataSource.getRepository(CommentLike);
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);

    // Fetch likes for the given post and comment
    const likes = await commentLikeRepository.find({
      where: { postId, commentId, status: true },
    });

    // Fetch user details for each like
    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await personalDetailsRepository.findOne({ where: { id: like.userId } });

        return {
          ...like,
          user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.emailAddress } : null,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      message: 'Likes fetched successfully.',
      data: { likes: likesWithUsers },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

// userlike list for post
export const getUserPostLikeList = async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }
    const likeRepository = AppDataSource.getRepository(Like);

    const likes = await likeRepository.find({ where: { postId, status: true } });
    console.log("First likes", likes);

    if (!likes) {
      return res.status(404).json({ status: 'error', message: 'post not available.' });
    }
    if (likes.length === 0) {
      return res.status(204).json({ status: 'success', message: 'No likes available for this post.' });
    }

    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    let users = await personalRepo.find({ where: { id: In(likes.map((like) => like.userId)) } });

    const getUserLike = async (userId: string) => {
      const like = await likeRepository.findOne({ where: { userId, postId } });
      return like;
    }

    const likers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        likerUrl: user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
        like: await getUserLike(user.id)
      }))
    );

    return res.status(200).json({ status: 'success', message: 'Likes fetched successfully.', data: { likers } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

// post commenters list
export const getPostCommentersList = async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }

    const commentLikeRepository = AppDataSource.getRepository(Comment);

    const comment = await commentLikeRepository.find({ where: { postId } });

    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'Post not available.' });
    }
    if (comment.length === 0) {
      return res.status(204).json({ status: 'success', message: 'No comments available for this post.' });
    }

    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    let users = await personalRepo.find({ where: { id: In(comment.map((comm) => comm.userId)) } });

    const commenters = await Promise.all(
      users.map(async (user) => ({
        ...user,
        commenterUrl: user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
      }))
    );

    return res
      .status(200)
      .json({ status: 'success', message: 'Commenters fetched successfully.', data: { commenters } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};
