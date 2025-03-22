import { Request, Response } from 'express';
import { Comment } from '../../entity/posts/Comment'; // Adjust the import path as needed
import { AppDataSource } from '@/server';
import { NestedComment } from '@/api/entity/posts/NestedComment';
import { formatTimestamp } from './UserPost';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { CommentLike } from '@/api/entity/posts/CommentLike';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { UserPost } from '@/api/entity/UserPost';
import { sendNotification } from '../notifications/SocketNotificationController';
import { generatePresignedUrl, uploadBufferDocumentToS3 } from '../s3/awsControllers';
import { Connection } from '@/api/entity/connection/Connections';
import { CreateMention } from './Mention';
import { In } from 'typeorm';
import { Mention } from '@/api/entity/posts/Mention';
import { NestedCommentLike } from '@/api/entity/posts/NestedCommentLike';
import multer from 'multer';
import { createNotification } from '../notify/Notify';
import { NotificationType, Notify } from '@/api/entity/notify/Notify';
import { getSocketInstance } from '@/socket';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  // isAdmin?: boolean;
}

const storage = multer.memoryStorage();
export const commentDocumentMiddleware = multer({ storage: storage }).array('files', 1);


export const createOrUpdateComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, text, commentId } = req.body;

    const userId = req.userId;
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


    const newComment = Comment.create({ userId, postId, text, createdBy: 'system', updatedBy: 'system' });

    if (req.files) {
      let uploadedDocumentUrl: { key: string; type: string } | undefined;
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          try {
            console.log('Uploading file:', file.originalname);
            const uploadedUrl = await uploadBufferDocumentToS3(file.buffer, userId, file.mimetype);
            uploadedDocumentUrl = {
              key: uploadedUrl.fileKey,
              type: file.mimetype,
            };

          } catch (uploadError) {
            console.error('S3 Upload Error:', uploadError);
          }
        }
      }
      newComment.mediaKeys = uploadedDocumentUrl;
    }

    const savedComment = await newComment.save();

    //Notify

    const postRepo = AppDataSource.getRepository(UserPost);
    const commentedPost = await postRepo.findOne({ where: { id: postId } });

    if (!commentedPost) {
      return res.status(400).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const commentedOnUser = await userRepo.findOne({ where: { id: commentedPost.userId } });
    const commentedByUser = await userRepo.findOne({ where: { id: userId } });

    if (!commentedByUser || !commentedOnUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    if (commentedPost.userId !== userId) {
      try {
        const imageKey = commentedByUser.profilePictureUploadId
          ? commentedByUser.profilePictureUploadId
          : null;

        await createNotification(
          NotificationType.COMMENT,
          commentedOnUser.id,
          userId,
          `${commentedByUser.firstName} ${commentedByUser.lastName} commented on your post`,
          {
            imageKey,
            postId: commentedPost.id,
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: commentedOnUser?.id, isRead: false } });

        const notify = {
          message: `${commentedByUser.firstName} ${commentedByUser.lastName} commented on your post`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            postId: commentedPost.id,
            isReadCount: notification.length,
          }
        }

        const io = getSocketInstance();
        const roomId = commentedOnUser.id;
        io.to(roomId).emit('newNotification', notify);


      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }

    // Extract mentions from comment text
    // const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    // const mentions = [...text.matchAll(mentionPattern)].map(match => match[1]);

    // if (mentions.length > 0) {
    //   const userRepository = AppDataSource.getRepository(PersonalDetails);
    //   const mentionedUsers = await userRepository.find({ where: { userName: In(mentions) } });
    //   const validMentionedUserIds = mentionedUsers.map(user => user.id);

    //   if (validMentionedUserIds.length !== mentions.length) {
    //     return res.status(404).json({
    //       status: 'error',
    //       message: 'One or more mentioned users do not exist.',
    //       invalidMentions: mentions.filter(m => !mentionedUsers.some(u => u.userName === m))
    //     });
    //   }

    //   const mentionRepo = AppDataSource.getRepository(Mention);
    //   const mentionResponses = [];
    //   for (const mentionedUser of mentionedUsers) {
    //     const mentionResponse = await mentionRepo.save({
    //       userId,
    //       postId,
    //       commentId: savedComment.id,
    //       mentionBy: userId,
    //       mentionTo: mentionedUser.id,
    //     });
    //     mentionResponses.push(mentionResponse);

    //     await sendNotification(
    //       mentionedUser.id,
    //       `${commenterInfo.firstName} mentioned you in a comment`,
    //       commenterInfo.profilePictureUploadId,
    //       `/feed/post/${postId}#${savedComment.id}`
    //     );
    //   }
    // }

    return res.status(201).json({
      status: 'success',
      message: 'Comment created successfully.',
      data: { comment: savedComment },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

// export const deleteComment = async (req: Request, res: Response) => {
//   const { commentId } = req.params;

//   if (!commentId) {
//     return res.status(400).json({ status: "fail", error: 'Comment ID is required' });
//   }

//   try {
//     const comment = await Comment.findOne({ where: { id: commentId } });

//     if (!comment) {
//       return res.status(400).json({ status: "fail", error: 'Comment not found' });
//     }

//     await comment.remove();

//     return res.status(200).json({ status: "success", message: 'Comment deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting comment:', error);
//     return res.status(500).json({ status: "error", message: 'An error occurred while deleting the comment' });
//   }
// };

export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { commentId } = req.params;

    if (!commentId) {
      return res.status(400).json({ status: "fail", message: 'Comment ID is required' });
    }

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepo.findOne({ where: { id: userId } });

    const commentRepo = AppDataSource.getRepository(Comment);
    const comment = await commentRepo.findOne({ where: { id: commentId } });

    if (!comment) {
      return res.status(404).json({ status: "fail", message: 'Comment not found' });
    }

    if (comment.userId !== req.userId && user?.isAdmin !== true) {
      return res.status(403).json({ status: "fail", message: 'You do not have permission to delete this comment' });
    }

    await commentRepo.delete(commentId);

    return res.status(200).json({ status: "success", message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ status: "error", message: 'An error occurred while deleting the comment' });
  }
};



export const getComments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const { postId } = req.params;
    const userId = req.userId;
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
    }) || [];

    if (comments.length === 0) {
      return res.status(200).json({ status: "success", message: "No comments available", data: { comments: [], pagination: { currentPage, itemsPerPage, totalComments: 0 } } });
    }

    // Format the comments
    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        const userRepository = AppDataSource.getRepository(PersonalDetails);
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
        });
        const commentLikeRepository = AppDataSource.getRepository(CommentLike);
        const [commentLikes, totalCommentLikes] = await commentLikeRepository.findAndCount({ where: { commentId: comment.id, status: true, } });
        const commentLike = await commentLikeRepository.findOne({ where: { userId, commentId: comment.id } });


        //-------------------------------------------------------------------- for nested comments---------------------------------------------------
        const nestedCommentRepository = AppDataSource.getRepository(NestedComment);

        const nestedComments = await nestedCommentRepository.find({
          where: { commentId: comment.id },
          order: { createdAt: 'ASC' },
        });

        if (!nestedComments) {
          return res.status(200).json({ status: "success", message: "No replies available" });
        }

        const formattedNestedComments = await Promise.all(
          nestedComments.map(async (comment) => {
            const userRepository = AppDataSource.getRepository(PersonalDetails);
            const commenter = await userRepository.findOne({
              where: { id: comment.userId },
            });

            const nestedCommentLikeRepository = AppDataSource.getRepository(NestedCommentLike);
            const [nestedCommentLikes, totalNestedCommentLikes] = await nestedCommentLikeRepository.findAndCount({ where: { nestedCommentId: comment.id, commentId: comment.commentId, status: true } });
            const nestedCommentLike = await nestedCommentLikeRepository.findOne({ where: { userId, commentId: comment.commentId, nestedCommentId: comment.id } });


            if (!commenter) {
              return res.status(400).json({ status: "error", message: "user for this comment not found" });
            }

            const profilePictureUrl = await generatePresignedUrl(commenter?.profilePictureUploadId);

            return {
              id: comment.id,
              commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim(),
              commenterBio: commenter?.bio,
              commenterUserRole: commenter?.userRole,
              text: comment.text,
              timestamp: formatTimestamp(comment.createdAt),
              postId: comment.postId,
              commentId: comment.commentId,
              likeCount: totalNestedCommentLikes,
              likeStatus: nestedCommentLike?.status,
              commenterId: commenter?.id,
              profilePic: profilePictureUrl,
              badgeName: commenter?.badgeName,
              isChild: comment.isChild,
              repliedTo: comment.repliedTo
            };
          })
        );

        if (!commenter) {
          return res.status(400).json({ status: "error", message: "user for this comment not found" });
        }
        // const profilePictureUrl = await generatePresignedUrl(commenter?.profilePictureUploadId);
        const profilePictureUrl = commenter?.profilePictureUploadId
          ? await generatePresignedUrl(commenter.profilePictureUploadId).catch(() => null)
          : null;

        return {
          id: comment.id,
          commentId: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim(),
          commenterBio: commenter?.bio,
          commenterUserRole: commenter?.userRole,
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          postId: comment.postId,
          likeStatus: commentLike?.status ? commentLike.status : false,
          likeCount: totalCommentLikes,
          commenterId: commenter?.id,
          profilePic: profilePictureUrl,
          badgeName: commenter?.badgeName,
          replyCount: formattedNestedComments.length,
          replies: formattedNestedComments,
          mediaUrls: comment.mediaKeys ? await generatePresignedUrl(comment.mediaKeys.key) : [],
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

export const createOrUpdateNestedComment = async (req: AuthenticatedRequest, res: Response) => {
  try {

    const { postId, commentId, text, createdBy, nestedCommentId, repliedTo, isChild = false } = req.body;

    const userId = req.userId;

    if (!userId || !postId || !text) {
      return res.status(400).json({ status: 'error', message: 'userId, postId, and text are required.' });
    }

    const nestedCommentRepo = AppDataSource.getRepository(NestedComment);
    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const parentCommentRepo = AppDataSource.getRepository(Comment);

    let savedComment;
    if (nestedCommentId) {
      console.log('Updating Nested Comment:', nestedCommentId);
      const nestedComment = await nestedCommentRepo.findOne({ where: { id: nestedCommentId } });

      if (!nestedComment) {
        return res.status(404).json({ status: 'error', message: 'Nested Comment not found.' });
      }

      nestedComment.text = text;
      nestedComment.updatedBy = createdBy || 'system';
      savedComment = await nestedCommentRepo.save(nestedComment);

      return res
        .status(200)
        .json({ status: 'success', message: 'Nested Comment updated successfully.', data: { nestedComment } });
    }

    // Validate parent comment

    const parentComment = await parentCommentRepo.findOne({ where: { id: commentId } });
    if (!parentComment) {
      return res.status(404).json({ status: 'error', message: 'Parent comment not found.' });
    }

    console.log('Creating new Nested Comment');

    savedComment = await nestedCommentRepo.save(
      nestedCommentRepo.create({
        userId,
        postId,
        commentId,
        text,
        isChild,
        repliedTo: repliedTo ? repliedTo : null,
        createdBy: createdBy || 'system',
        updatedBy: createdBy || 'system',
      })
    );

    console.log('Saved Comment:', savedComment);

    const postRepo = AppDataSource.getRepository(UserPost);
    const nestedCommentedPost = await postRepo.findOne({ where: { id: postId } });

    if (!nestedCommentedPost) {
      return res.status(400).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const repliedOnUser = await userRepo.findOne({ where: { id: nestedCommentedPost.userId } });
    const repliedByUser = await userRepo.findOne({ where: { id: userId } });

    if (!repliedByUser || !repliedOnUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User information not found.',
      });
    }

    if (nestedCommentedPost.userId !== userId) {
      try {
        const imageKey = repliedByUser.profilePictureUploadId
          ? repliedByUser.profilePictureUploadId
          : null;

        await createNotification(
          NotificationType.REPLY,
          repliedOnUser.id,
          userId,
          `${repliedByUser.firstName} ${repliedByUser.lastName} replied to your comment`,
          {
            imageKey,
            postId: nestedCommentedPost.id,
            commentId: commentId,
            nestedCommentId: nestedCommentId
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: repliedOnUser?.id, isRead: false } });

        const notify = {
          message: `${repliedByUser.firstName} ${repliedByUser.lastName} replied to your comment`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            postId: nestedCommentedPost.id,
            commentId: commentId,
            nestedCommentId: nestedCommentId,
            isReadCount: notification.length
          }
        }

        const io = getSocketInstance();
        const roomId = repliedOnUser.id;
        io.to(roomId).emit('newNotification', notify);

      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }

    // const findUser = await userRepo.findOne({ where: { id: userId } });

    // let notification = null;
    // if (findUser && findUser.id !== parentComment.userId) {
    //   notification = await sendNotification(
    //     parentComment.userId,
    //     `${findUser.firstName} ${findUser.lastName} replied to your comment`,
    //     findUser.profilePictureUploadId,
    //     `/feed/post/${postId}#${commentId}`
    //   );
    //   console.log('Notification sent:', notification);
    // }

    // Extract mentions
    // const mentionPattern = /@([\w.]+)/g;
    // const mentionedUsernames = [...text.matchAll(mentionPattern)].map((match) => match[1]);

    // let mentionResponses = [];
    // if (mentionedUsernames.length > 0) {
    //   console.log('Extracted Mentions:', mentionedUsernames);

    //   // Fetch mentioned users
    //   const mentionedUsers = await userRepo.find({
    //     where: { userName: In(mentionedUsernames) },
    //   });

    //   for (const mentionedUser of mentionedUsers) {
    //     if (mentionedUser.id !== userId) {
    //       const mentionResponse = await CreateMention({
    //         userId,
    //         commentId,
    //         nestedCommentId: savedComment.id,
    //         mentionBy: userId,
    //         mentionTo: mentionedUser.id,
    //       });
    //       mentionResponses.push(mentionResponse);
    //       console.log(`Mention created for @${mentionedUser.userName}:`, mentionResponse);

    //       await sendNotification(
    //         mentionedUser.id,
    //         `${findUser?.firstName} mentioned you in a reply to a comment`,
    //         findUser?.profilePictureUploadId,
    //         `/feed/post/${postId}#${commentId}`
    //       );
    //     }
    //   }
    // }

    return res.status(201).json({
      status: 'success',
      message: 'Nested Comment created successfully.',
      data: { savedComment },
    });
  } catch (error) {
    console.error('Error in createOrUpdateNestedComment:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};

export const deleteNestedComment = async (req: AuthenticatedRequest, res: Response) => {
  const { nestedCommentId } = req.params;
  const userId = req.userId;

  if (!nestedCommentId) {
    return res.status(400).json({ status: "success", message: 'Nested Comment ID is required' });
  }

  try {
    const nestedComment = await NestedComment.findOne({ where: { id: nestedCommentId } });

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!nestedComment) {
      return res.status(404).json({ status: "fail", message: 'Nested Comment not found' });
    }

    if (nestedComment.userId !== req.userId && user?.isAdmin !== true) {
      return res.status(403).json({ status: "fail", message: 'You do not have permission to delete this reply' });
    }

    await nestedComment.remove();

    return res.status(200).json({ status: "success", message: 'Nested Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting nested comment:', error);
    return res.status(500).json({ status: "success", message: 'An error occurred while deleting the nested comment' });
  }
};

// export const deleteNestedComment = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { nestedCommentId } = req.params;

//     if (!nestedCommentId) {
//       return res.status(400).json({ status: "fail", message: 'Nested Comment ID is required' });
//     }

//     const nestedCommentRepo = AppDataSource.getRepository(NestedComment);
//     const nestedComment = await nestedCommentRepo.findOne({ where: { id: nestedCommentId } });

//     if (!nestedComment) {
//       return res.status(404).json({ status: "fail", message: 'Nested Comment not found' });
//     }

//     if (nestedComment.userId !== req.userId && !req.isAdmin) {
//       return res.status(403).json({ status: "fail", message: 'You do not have permission to delete this comment' });
//     }

//     await nestedCommentRepo.delete(nestedCommentId);

//     return res.status(200).json({ status: "success", message: 'Nested Comment deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting nested comment:', error);
//     return res.status(500).json({ status: "error", message: 'An error occurred while deleting the nested comment' });
//   }
// };

export const getNestedComments = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    if (!commentId) {
      return res.status(400).json({ status: 'success', message: 'commentId is required.' });
    }

    const nestedCommentRepository = AppDataSource.getRepository(NestedComment);

    const nestedComments = await nestedCommentRepository.find({
      where: { commentId },
      order: { createdAt: 'ASC' },
    });

    if (!nestedComments) {
      return res.status(200).json({ status: "success", message: "No replies available" });
    }

    const formattedNestedComments = await Promise.all(
      nestedComments.map(async (comment) => {
        const userRepository = AppDataSource.getRepository(PersonalDetails);
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
          select: ['firstName', 'lastName', 'id', 'profilePictureUploadId'],
        });

        if (!commenter) {
          return res.status(400).json({ status: "error", message: "user for this comment not found" });
        }

        const profilePictureUrl = await generatePresignedUrl(commenter?.profilePictureUploadId);

        // // Create a notification
        // const notificationRepos = AppDataSource.getRepository(Notifications);
        // let notification = notificationRepos.create({
        //   userId: comment.userId,
        //   message: ` ${commenter?.firstName} ${commenter?.lastName} replied your comment`,
        //   navigation: `/feed/post/${comment.id}`,
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
          profilePic: profilePictureUrl,
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

// Get comment like user list
export const getCommentLikeUserList = async (req: Request, res: Response) => {
  try {
    const { commentId, userId } = req.body;

    if (!commentId) {
      return res.status(400).json({ status: 'error', message: 'commentId is required.' });
    }

    const commentLikeRepository = AppDataSource.getRepository(CommentLike);
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);

    const commentLikes = await commentLikeRepository.find({ where: { commentId } });
    const totalLikes = await commentLikeRepository.count({ where: { commentId } });

    const likeList = await Promise.all(
      commentLikes.map(async (like) => {
        const user = await personalDetailsRepository.findOne({
          where: { id: like.userId },
          select: ['firstName', 'lastName', 'id', 'profilePictureUploadId', 'userRole'],
        });

        if (user) {
          const userImg = user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null;

          // Check if the user is a mutual connection, but exclude the requesting user
          let isMutualConnection: boolean | null = null;
          if (userId !== user.id) {
            const mutualConnection = await connectionRepository.findOne({
              where: [
                { requesterId: userId, receiverId: user.id, status: 'accepted' },
                { requesterId: user.id, receiverId: userId, status: 'accepted' },
              ],
            });
            isMutualConnection = mutualConnection ? true : false;
          }

          return {
            ...user,
            profilePicture: userImg,
            isMutualConnection,
          };
        }
        return null;
      })
    );

    const filteredLikeList = likeList.filter((user) => user !== null);

    // Check if the given user has liked the comment
    const userLikeStatus = commentLikes.some((commentLike) => commentLike.userId === userId);

    return res.status(200).json({
      status: 'success',
      message: 'Comment like user list fetched successfully.',
      data: { likeList: filteredLikeList, userLikeStatus, totalLikes },
    });
  } catch (error) {
    console.error('Error fetching comment like user list:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error', error });
  }
};
