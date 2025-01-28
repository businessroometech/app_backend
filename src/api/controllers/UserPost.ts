import { Request, Response } from 'express';
import { UserPost } from '../entity/UserPost';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../entity/personal/PersonalDetails';
import { Comment } from '../entity/posts/Comment';
import { Like } from '../entity/posts/Like';
import { generatePresignedUrl } from './s3/awsControllers';
import { In } from 'typeorm';
import { Reaction } from '../entity/posts/Reaction';
import { createMention } from './posts/Mention';
import { Mention } from '../entity/posts/Mention';
import { broadcastMessage, getSocketInstance } from '@/socket';

// Utility function to format the timestamp (e.g., "2 seconds ago", "3 minutes ago")
export const formatTimestamp = (createdAt: Date): string => {
  const now = Date.now();
  const createdTime = new Date(createdAt).getTime();
  const secondsAgo = Math.floor((now - createdTime) / 1000);

  if (secondsAgo < 60) return `just now`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) return `${daysAgo}d`;

  const weeksAgo = Math.floor(daysAgo / 7);
  if (weeksAgo < 52) return `${weeksAgo}w`;

  const monthsAgo = Math.floor(weeksAgo / 4);
  if (monthsAgo < 12) return `${monthsAgo}mo`;

  const yearsAgo = Math.floor(monthsAgo / 12);
  return `${yearsAgo}y`;
};

// user post and and update post
export const CreateUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, title, content, hashtags, mediaKeys, repostedFrom, repostText } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    const userRepos = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepos.findOneBy({ id: userId });
    if (!user) {
      return res.status(400).json({
        message: 'User ID is invalid or does not exist.',
      });
    }

    const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    const mentions = [...content.matchAll(mentionPattern)].map((match) => match[1]);

    // Validate mentioned users
    const mentionedUsers = await userRepos.findByIds(mentions);
    const validMentionedUserIds = mentionedUsers.map((u) => u.id);

    // Check if all mentioned users exist
    if (mentions.length > 0 && validMentionedUserIds.length !== mentions.length) {
      return res.status(404).json({
        message: 'One or more mentioned users do not exist.',
        invalidMentions: mentions.filter((m) => !validMentionedUserIds.includes(m)),
      });
    }

    // Create the post
    const postRepository = AppDataSource.getRepository(UserPost);
    const newPost = postRepository.create({
      userId,
      title,
      content,
      hashtags,
      mediaKeys,
      repostedFrom,
      repostText,
      isRepost: repostedFrom !== null ? true : false
    });

    const savedPost = await postRepository.save(newPost);

    // Create mention entries for valid mentioned users
    // if (validMentionedUserIds.length > 0) {
    //   const mentionRepository = AppDataSource.getRepository(Mention);

    //   const mentionsToSave = validMentionedUserIds.map((mentionedUserId) =>
    //     mentionRepository.create({
    //       user: [user.id], 
    //       postId: [savedPost.id], 
    //       mentionBy: userId,
    //       mentionTo: mentionedUserId,
    //     })
    //   );

    //   await mentionRepository.save(mentionsToSave);
    // }

    
     // Broadcast the "post sent" event
     const io = getSocketInstance();
     io.emit('postSent', { success: true, postId: savedPost.id });
 
    return res.status(201).json({
      message: 'Post created successfully.',
      data: savedPost,
      // mentions: validMentionedUserIds,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not create post.',
      error: error.message,
    });
  }
};

// FindUserPost by userId
export const FindUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, page = 1, limit = 5 } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['firstName', 'lastName'],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Invalid User ID.',
      });
    }

    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    // Fetch user posts with pagination
    const [userPosts, totalPosts] = await userPostRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!userPosts || userPosts.length === 0) {
      return res.status(200).json({ status: 'success', message: 'No posts found for this user.', data: { posts: [] } });
    }

    const postIds = userPosts.map((post) => post.id);

    // Fetch related comments and likes
    const comments = await commentRepository.find({
      where: { postId: In(postIds) },
    });

    const likes = await likeRepository.find({
      where: { postId: In(postIds) },
    });

    // Fetch media keys and URLs for posts
    const mediaKeysWithUrls = await Promise.all(
      userPosts.map(async (post) => ({
        postId: post.id,
        mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key))) : [],
      }))
    );

    // Format comments for each post
    const postComments = await commentRepository.find({
      where: { postId: In(postIds) },
      order: { createdAt: 'ASC' },
      take: 5, // Limit comments per post
    });

    const formattedComments = await Promise.all(
      postComments.map(async (comment) => {
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
          select: ['firstName', 'lastName'],
        });

        return {
          Id: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`,
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          postId: comment.postId,
        };
      })
    );

    // Format posts with related data
    const formattedPosts = userPosts.map((post) => {
      const mediaUrls = mediaKeysWithUrls.find((media) => media.postId === post.id)?.mediaUrls || [];
      const likeCount = likes.filter((like) => like.postId === post.id).length;
      const commentCount = comments.filter((comment) => comment.postId === post.id).length;
      const likeStatus = likes.some((like) => like.postId === post.id && like.userId === userId);

      return {
        post: {
          Id: post.id,
          userId: post.userId,
          title: post.title,
          content: post.content,
          hashtags: post.hashtags,
          mediaKeys: mediaUrls,
          likeCount,
          commentCount,
          likeStatus,
        },
        userDetails: {
          firstName: user.firstName,
          lastName: user.lastName,
          timestamp: formatTimestamp(post.createdAt),
        },
        comments: formattedComments.filter((comment) => comment.postId === post.id),
      };
    });

    return res.status(200).json({
      message: 'User posts retrieved successfully.',
      data: {
        posts: formattedPosts,
        totalPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not retrieve user posts.',
      error: error.message,
    });
  }
};
// find and update user post
export const UpdateUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, id, title, content, hashtags, mentionId, mediaIds, likeIds, commentIds, shareIds } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    // Get the PersonalDetails repository
    const userRepository = AppDataSource.getRepository(PersonalDetails);

    // Check if the user exists
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['profilePictureUploadId', 'firstName', 'lastName', 'bio', 'occupation'],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Invalid User ID.',
      });
    }

    // Find the user post
    const userPost = await UserPost.findOne({ where: { id } });

    // Update the user post
    userPost!.title = title;
    userPost!.content = content;
    userPost!.hashtags = hashtags;

    await userPost!.save();

    return res.status(200).json({
      message: 'User post updated successfully.',
      data: userPost,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not update user post.',
      error: error.message,
    });
  }
};

// find and delete user post
export const DeleteUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { PostId } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    // const userRepos = AppDataSource.getRepository(PersonalDetails);
    // const user = await userRepos.findOneBy({ userId });
    // if (!user) {
    //   return res.status(400).json({
    //     message: 'User ID is invalid or does not exist.',
    //   });
    // }

    // Find the user post
    const userPost = await UserPost.findOne({ where: { id: PostId } });

    // Delete the user post
    await userPost!.remove();

    return res.status(200).json({
      message: 'User post deleted successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not delete user post.',
      error: error.message,
    });
  }
};

// Get all posts for public view

// Get all posts for public view
export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, page, limit = 5 } = req.body;

    // Get the repositories
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    // Get the total number of posts (without pagination)
    const totalPosts = await userPostRepository.count();

    // Get all posts with pagination
    const posts = await userPostRepository.find({
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      select: ['id', 'userId', 'title', 'content', 'hashtags', 'mediaKeys', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No posts found for this user.',
        data: { posts: [], page, limit, totalPosts },
      });
    }

    const postIds = posts.map((post) => post.id);

    // Fetch comments, likes, and reactions for the posts
    const comments = await commentRepository.find({
      where: { postId: In(postIds) },
    });

    const likes = await likeRepository.find({
      where: { postId: In(postIds) },
    });



    // Generate media URLs for posts
    const mediaKeysWithUrls = await Promise.all(
      posts.map(async (post) => ({
        postId: post.id,
        mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key))) : [],
      }))
    );

    const getLikeStatus = async (postId: string) => {
      const like = await likeRepository.findOne({ where: { userId, postId } });
      return like?.status;
    };

    // Format the posts with user details, likes, comments, and reactions
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Fetch media URLs related to the post
        const mediaUrls = mediaKeysWithUrls.find((media) => media.postId === post.id)?.mediaUrls || [];

        // Calculate like count and comment count
        const likeCount = likes.filter((like) => like.postId === post.id).length;
        const commentCount = comments.filter((comment) => comment.postId === post.id).length;
        const likeStatus = await getLikeStatus(post.id);


        const reactionRepository = AppDataSource.getRepository(Reaction);

        // Fetch reactions with related post data
        const reactions = await reactionRepository.find({
          where: { post: { id: In(postIds) } },
          relations: ['post', 'user'],
        });

        const postReactions = reactions.filter((reaction) => reaction.post?.id === post.id);

        const totalReactions = postReactions.reduce((acc: Record<string, number>, reaction) => {
          if (reaction.reactionType) {
            acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
          }
          return acc;
        }, {});

        // Fetch the user's reaction to the post
        const userReaction =
          postReactions.find((reaction) => reaction.user?.id === userId)?.reactionType || null;

        // Fetch top 5 comments for the post
        const postComments = await commentRepository.find({
          where: { postId: post.id },
          order: { createdAt: 'ASC' },
          take: 5,
        });

        // Format the comments
        const formattedComments = await Promise.all(
          postComments.map(async (comment) => {
            const commenter = await userRepository.findOne({
              where: { id: comment.userId },
            });

            return {
              commenter,
            };
          })
        );

        // Fetch user details for the post creator
        const user = await userRepository.findOne({
          where: { id: post.userId },
        });

        // Return the formatted post object
        return {
          post: {
            Id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            mediaUrls: mediaUrls,
            likeCount,
            commentCount,
            likeStatus,
            reactions: totalReactions,
            userReaction,
          },
          userDetails: {
            postedId: user?.id,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            timestamp: formatTimestamp(post.createdAt),
            userRole: user?.userRole,
            avatar: user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
          },
          comments: formattedComments,
        };
      })
    );

    // Return the formatted posts with pagination info
    return res.status(200).json({
      message: 'User posts retrieved successfully.',
      data: {
        posts: formattedPosts,
        page,
        limit,
        totalPosts,
      },
    });
  } catch (error: any) {
    // Handle and log errors
    return res.status(500).json({
      message: 'Internal server error. Could not fetch posts.',
      error: error.message,
    });
  }
};

// get new post socket show in real time true or false
