import { Request, Response } from 'express';
import { Like } from '../../entity/posts/Like';
import { AppDataSource } from '@/server';
import { CommentLike } from '@/api/entity/posts/CommentLike';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { UserPost } from '@/api/entity/UserPost';
import { sendNotification } from '../notifications/SocketNotificationController';
import { generatePresignedUrl } from '../s3/awsControllers';
import { FindOptionsWhere, In } from 'typeorm';
import { Comment } from '@/api/entity/posts/Comment';
import { NestedCommentLike } from '@/api/entity/posts/NestedCommentLike';
import { createNotification } from '../notify/Notify';
import { NotificationType, Notify } from '@/api/entity/notify/Notify';
import { getSocketInstance } from '@/socket';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const createLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, reactionId } = req.body;
    const userId = req.userId;

    if (!userId || !postId) {
      return res.status(400).json({ status: 'error', message: 'userId and postId are required.' });
    }
    const likeRepository = AppDataSource.getRepository(Like);
    let like = await likeRepository.findOne({ where: { userId, postId } });

    if (like) {
      if (like.reactionId != reactionId) {
        like.status = true;
        like.reactionId = reactionId;
      } else {
        // like.status = false;
        like.status = !like.status;
        // like.reactionId = 1000;
      }
    } else {
      like = Like.create({
        userId,
        userIdRef: { id: userId },
        postId,
        status: true,
        reactionId,
      });
    }
    await like.save();

    // Notify

    const postRepo = AppDataSource.getRepository(UserPost);
    const likedPost = await postRepo.findOne({ where: { id: postId } });

    if (!likedPost) {
      return res.status(400).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const likedOnUser = await userRepo.findOne({ where: { id: likedPost.userId } });
    const likedByUser = await userRepo.findOne({ where: { id: userId } });

    if (!likedByUser || !likedOnUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    if (likedPost.userId !== userId && like.status) {
      try {
        const imageKey = likedByUser.profilePictureUploadId ? likedByUser.profilePictureUploadId : null;

        await createNotification(
          NotificationType.REACTION,
          likedOnUser.id,
          userId,
          `${likedByUser.firstName} ${likedByUser.lastName} reacted on your post`,
          {
            imageKey,
            postId: likedPost.id,
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: likedOnUser?.id, isRead: false } });

        const notify = {
          message: `${likedByUser.firstName} ${likedByUser.lastName} reacted on your post`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            postId: likedPost.id,
            isReadCount: notification.length,
          },
        };

        const io = getSocketInstance();
        const roomId = likedOnUser.id;
        io.to(roomId).emit('newNotification', notify);
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Like status updated.', data: { like } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

export const getAllLikesForPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { reactionId, page = '1', limit = '10' } = req.query;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const postRepo = AppDataSource.getRepository(UserPost);

    const post = await postRepo.findOne({ where: { id: postId } });

    if (!post) {
      return res.status(400).json({ status: 'error', message: 'invalid postId.' });
    }

    const likeRepository = AppDataSource.getRepository(Like);
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);

    // Fetch likes for the given post
    let likes;
    if (reactionId) {
      // likes = await likeRepository.find({
      //   where: { postId, status: true, reactionId: Number(reactionId) },
      //   take: limitNumber,
      //   skip: offset,
      // });

      likes = await likeRepository
        .createQueryBuilder('like')
        .leftJoinAndSelect('like.userIdRef', 'user')
        .where('like.postId = :postId', { postId })
        .andWhere('like.status = true')
        .andWhere('like.reactionId = :reactionId', { reactionId: Number(reactionId) })
        .andWhere('user.active = :active', { active: 1 })
        .take(limitNumber)
        .skip(offset)
        .getMany();
    } else {
      // likes = await likeRepository.find({
      //   where: { postId, status: true},
      //   take: limitNumber,
      //   skip: offset,
      // });

      likes = await likeRepository
        .createQueryBuilder('like')
        .leftJoinAndSelect('like.userIdRef', 'user')
        .where('like.postId = :postId', { postId })
        .andWhere('like.status = true')
        .andWhere('user.active = :active', { active: 1 })
        .take(limitNumber)
        .skip(offset)
        .getMany();
    }

    // Fetch user details for each like
    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await personalDetailsRepository.findOne({ where: { id: like.userId } });

        return {
          ...like,
          user: {
            ...user,
            profilePictureUploadUrl: user?.profilePictureUploadId
              ? await generatePresignedUrl(user?.profilePictureUploadId)
              : null,
          },
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

export const createCommentLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, commentId, reactionId } = req.body;

    const userId = req.userId;

    if (!userId || !postId || !commentId) {
      return res.status(400).json({ status: 'error', message: 'userId, postId, and commentId are required.' });
    }

    const commentLikeRepository = AppDataSource.getRepository(CommentLike);

    let like = await commentLikeRepository.findOne({ where: { userId, postId, commentId } });

    if (like) {
      if (like.reactionId != reactionId) {
        like.status = true;
        like.reactionId = reactionId;
      } else {
        // like.status = false;
        like.status = !like.status;
        // like.reactionId = 1000;
      }
    } else {
      like = commentLikeRepository.create({
        userId,
        userRef: { id: userId },
        postId,
        commentId,
        status: true,
        reactionId,
      });
    }

    await commentLikeRepository.save(like);

    // Notify

    const postRepo = AppDataSource.getRepository(UserPost);
    const likedCommentOfPost = await postRepo.findOne({ where: { id: postId } });

    if (!likedCommentOfPost) {
      return res.status(400).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const likedOnUser = await userRepo.findOne({ where: { id: likedCommentOfPost.userId } });
    const likedByUser = await userRepo.findOne({ where: { id: userId } });

    if (!likedByUser || !likedOnUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    if (likedCommentOfPost.userId !== userId && like.status) {
      try {
        const imageKey = likedByUser.profilePictureUploadId ? likedByUser.profilePictureUploadId : null;

        await createNotification(
          NotificationType.COMMENT_LIKE,
          likedOnUser.id,
          userId,
          `${likedByUser.firstName} ${likedByUser.lastName} reacted on your comment`,
          {
            imageKey,
            postId: likedCommentOfPost.id,
            commentId: commentId,
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: likedOnUser?.id, isRead: false } });

        const notify = {
          message: `${likedByUser.firstName} ${likedByUser.lastName} reacted on your comment`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            postId: likedCommentOfPost.id,
            commentId: commentId,
            isReadCount: notification.length,
          },
        };

        const io = getSocketInstance();
        const roomId = likedOnUser.id;
        io.to(roomId).emit('newNotification', notify);
      } catch (error) {
        console.error('Error creating notification:', error);
      }
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
      where: { postId, commentId, status: true, userRef: { active: 1 } },
    });

    // Fetch user details for each like
    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await personalDetailsRepository.findOne({ where: { id: like.userId } });

        return {
          ...like,
          user: user
            ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.emailAddress }
            : null,
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
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }
    const likeRepository = AppDataSource.getRepository(Like);

    // const likes = await likeRepository.find({ where: { postId, status: true } });

    const likes = await likeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.userIdRef', 'user')
      .where('like.postId = :postId', { postId })
      .andWhere('like.status = true')
      .andWhere('user.active = :active', { active: 1 })
      .getMany();

    // console.log('First likes', likes);
    // console.log(likes.length);

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
    };

    const likers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        likerUrl: user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
        like: await getUserLike(user.id),
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
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }

    const commentLikeRepository = AppDataSource.getRepository(Comment);

    // const comment = await commentLikeRepository.find({ where: { postId } });
    const comment = await commentLikeRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.userRef', 'user')
      .where('comment.postId = :postId', { postId })
      .andWhere('user.active = :active', { active: 1 })
      .getMany();

    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'not available.' });
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

export const createNestedCommentLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, commentId, nestedCommentId, reactionId } = req.body;

    const userId = req.userId;

    if (!userId || !postId || !commentId || !nestedCommentId) {
      return res
        .status(400)
        .json({ status: 'error', message: 'userId, postId, nestedCommentId and commentId are required.' });
    }

    const nestedCommentLikeRepository = AppDataSource.getRepository(NestedCommentLike);

    let like = await nestedCommentLikeRepository.findOne({ where: { userId, postId, commentId, nestedCommentId } });

    if (like) {
      if (like.reactionId != reactionId) {
        like.status = true;
        like.reactionId = reactionId;
      } else {
        // like.status = false;
        like.status = !like.status;
        // like.reactionId = 1000;
      }
    } else {
      like = nestedCommentLikeRepository.create({
        userId,
        userRef: { id: userId },
        postId,
        commentId,
        nestedCommentId,
        status: true,
        reactionId,
      });
    }

    await nestedCommentLikeRepository.save(like);

    //Notify

    const postRepo = AppDataSource.getRepository(UserPost);
    const likedNestedCommentOfPost = await postRepo.findOne({ where: { id: postId } });

    if (!likedNestedCommentOfPost) {
      return res.status(400).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const likedOnUser = await userRepo.findOne({ where: { id: likedNestedCommentOfPost.userId } });
    const likedByUser = await userRepo.findOne({ where: { id: userId } });

    if (!likedByUser || !likedOnUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    if (likedNestedCommentOfPost.userId !== userId && like.status) {
      try {
        const imageKey = likedByUser.profilePictureUploadId ? likedByUser.profilePictureUploadId : null;

        await createNotification(
          NotificationType.REPLY_LIKE,
          likedOnUser.id,
          userId,
          `${likedByUser.firstName} ${likedByUser.lastName} reacted on your reply`,
          {
            imageKey,
            postId: likedNestedCommentOfPost.id,
            commentId: commentId,
            nestedCommentId: nestedCommentId,
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: likedOnUser?.id, isRead: false } });

        const notify = {
          message: `${likedByUser.firstName} ${likedByUser.lastName} reacted on your reply`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            postId: likedNestedCommentOfPost.id,
            commentId: commentId,
            nestedCommentId: nestedCommentId,
            isReadCount: notification.length,
          },
        };

        const io = getSocketInstance();
        const roomId = likedOnUser.id;
        io.to(roomId).emit('newNotification', notify);
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Nested Comment Like status updated.', data: { like } });
  } catch (error: any) {
    console.error('Error details:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error: error.message });
  }
};
