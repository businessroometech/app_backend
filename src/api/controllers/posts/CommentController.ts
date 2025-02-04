import { Request, Response } from 'express';
import { Comment } from '../../entity/posts/Comment'; // Adjust the import path as needed
import { AppDataSource } from '@/server';
import { NestedComment } from '@/api/entity/posts/NestedComment';
import { formatTimestamp } from '../UserPost';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { CommentLike } from '@/api/entity/posts/CommentLike';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { UserPost } from '@/api/entity/UserPost';
import { sendNotification } from '../notifications/SocketNotificationController';

export const createOrUpdateComment = async (req: Request, res: Response) => {
  try {
    const { userId, postId, text, commentId } = req.body;

    if (!userId || !postId || !text) {
      return res.status(400).json({ status: 'error', message: 'userId, postId, and text are required.' });
    }

    if (commentId) {
      const comment = await Comment.findOne({ where: { id: commentId } });

      if (!comment) {
        return res.status(404).json({ status: 'error', message: 'Comment not found.' });
      }

      comment.text = text;
      comment.updatedBy = 'system';

      await comment.save();

      return res.status(200).json({ status: 'success', message: 'Comment updated successfully.', data: { comment } });
    }

    const comment = Comment.create({
      userId,
      postId,
      text,
      createdBy: 'system',
      updatedBy: 'system',
    });

    await comment.save();

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
    // const notificationRepo = AppDataSource.getRepository(Notifications);
    // let notification = notificationRepo.create({
    //   userId: userInfo.id,
    //   message: `${commenterInfo.firstName} ${commenterInfo.lastName} commented on your post`,
    //   navigation: `/feed/home#${postId}`,
    // });
    // // Save the notification
    // notification = await notificationRepo.save(notification);

    const media = commenterInfo.profilePictureUploadId ? commenterInfo.profilePictureUploadId : null;
    if (userPost.userId !== commenterInfo.id) {
      await sendNotification(
        userPost.userId,
        `${commenterInfo.firstName} ${commenterInfo.lastName} commented on your post`,
        media,
        `/feed/home#${commentId}`
      );
    }

    return res.status(201).json({ status: 'success', message: 'Comment created successfully.', data: { comment } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const { commentId } = req.body;

  if (!commentId) {
    return res.status(400).json({ error: 'Comment ID is required' });
  }

  try {
    const comment = await Comment.findOne({ where: { id: commentId } });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await comment.remove();

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the comment' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { userId, postId, page = 1, limit = 5 } = req.body;

    if (!postId) {
      return res.status(400).json({ status: 'error', message: 'postId is required.' });
    }

    const currentPage = Math.max(Number(page), 1);
    const itemsPerPage = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * itemsPerPage;

    const commentRepository = AppDataSource.getRepository(Comment);

    const comments = await commentRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
      take: itemsPerPage,
      skip,
    });

    // Format the comments
    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        const userRepository = AppDataSource.getRepository(PersonalDetails);
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
          select: ['firstName', 'lastName', 'id'],
        });
        const commentLikeRepository = AppDataSource.getRepository(CommentLike);
        const commentLike = await commentLikeRepository.findOne({ where: { userId, commentId: comment.id } });

        return {
          id: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim(),
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          postId: comment.postId,
          likeStatus: commentLike?.status ? commentLike.status : false,
          commenterId: commenter?.id,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      message: 'Comments fetched successfully.',
      data: {
        comments: formattedComments,
        pagination: {
          currentPage,
          itemsPerPage,
          totalComments: comments.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const createOrUpdateNestedComment = async (req: Request, res: Response) => {
  try {
    const { userId, postId, commentId, text, createdBy, nestedCommentId } = req.body;
    if (!userId || !postId || !text) {
      return res.status(400).json({ status: 'error', message: 'userId, postId, and text are required.' });
    }
    const nestedCommentRepo = AppDataSource.getRepository(NestedComment);

    if (nestedCommentId) {
      const nestedComment = await nestedCommentRepo.findOne({ where: { id: nestedCommentId } });

      if (!nestedComment) {
        return res.status(404).json({ status: 'error', message: 'Nested Comment not found.' });
      }

      nestedComment.text = text;
      nestedComment.updatedBy = createdBy || 'system';

      await nestedComment.save();

      return res
        .status(200)
        .json({ status: 'success', message: 'Nested Comment updated successfully.', data: { nestedComment } });
    }

    // Fetch the parent comment details
    const parentCommentRepo = AppDataSource.getRepository(Comment);
    const parentComment = await parentCommentRepo.findOne({ where: { id: commentId } });

    if (!parentComment) {
      return res.status(404).json({ status: 'error', message: 'Parent comment not found.' });
    }
    const comment = nestedCommentRepo.create({
      userId,
      postId,
      commentId,
      text,
      createdBy: createdBy || 'system',
      updatedBy: createdBy || 'system',
    });

    const savedComment = await nestedCommentRepo.save(comment);

    // Fetch user details
    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const findUser = await userRepo.findOne({ where: { id: savedComment.userId } });

    let notification = null;
    // Send notification on comment
    if (findUser?.id !== parentComment.userId) {
      notification = await sendNotification(
        parentComment.userId,
        `${findUser?.firstName} ${findUser?.lastName} replied to your comment`,
        findUser?.profilePictureUploadId,
        `/feed/home#${commentId}`
      );
    }
    if (notification) {
      return res
        .status(201)
        .json({ status: 'success', message: 'Comment created successfully.', data: { savedComment, notification } });
    }
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

export const deleteNestedComment = async (req: Request, res: Response) => {
  const { nestedCommentId } = req.body;

  if (!nestedCommentId) {
    return res.status(400).json({ error: 'Nested Comment ID is required' });
  }

  try {
    const nestedComment = await NestedComment.findOne({ where: { id: nestedCommentId } });

    if (!nestedComment) {
      return res.status(404).json({ error: 'Nested Comment not found' });
    }

    await nestedComment.remove();

    return res.status(200).json({ message: 'Nested Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting nested comment:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the nested comment' });
  }
};

export const getNestedComments = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ status: 'success', message: 'commentId is required.' });
    }

    const nestedCommentRepository = AppDataSource.getRepository(NestedComment);

    const nestedComments = await nestedCommentRepository.find({
      where: { commentId },
      order: { createdAt: 'ASC' },
    });

    const formattedNestedComments = await Promise.all(
      nestedComments.map(async (comment) => {
        const userRepository = AppDataSource.getRepository(PersonalDetails);
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
          select: ['firstName', 'lastName', 'id'],
        });

        // // Create a notification
        // const notificationRepos = AppDataSource.getRepository(Notifications);
        // let notification = notificationRepos.create({
        //   userId: comment.userId,
        //   message: ` ${commenter?.firstName} ${commenter?.lastName} replied your comment`,
        //   navigation: `/feed/home#${comment.id}`,
        // });
        // notification = await notificationRepos.save(notification);

        return {
          id: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim(),
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          postId: comment.postId,
          commentId: comment.commentId,
          commenterId: commenter?.id,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      message: 'Nested comments fetched successfully.',
      data: { nestedComments: formattedNestedComments },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};
