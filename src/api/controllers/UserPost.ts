import { Request, Response } from 'express';
import { UserPost } from '../entity/UserPost';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../entity/personal/PersonalDetails';
import { Comment } from '../entity/posts/Comment';
import { Like } from '../entity/posts/Like';
import { generatePresignedUrl } from './s3/awsControllers';
import { In } from 'typeorm';

// Utility function to format the timestamp (e.g., "2 seconds ago", "3 minutes ago")
export const formatTimestamp = (createdAt: Date): string => {
  const now = Date.now();
  const createdTime = new Date(createdAt).getTime();
  const secondsAgo = Math.floor((now - createdTime) / 1000);

  if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hours ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo} days ago`;
};

// user post and and update post
export const CreateUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, title, content, hashtags, mediaKeys } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    const userRepos = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepos.findOneBy({ id: userId });
    if (!user) {
      return res.status(400).json({
        message: 'User ID is invalid or does not exist.',
      });
    }

    // Create a new post instance
    const newPost = UserPost.create({
      userId,
      title,
      content,
      hashtags,
      mediaKeys,
    });
    await newPost.save();
    return res.status(201).json({
      message: 'Post created successfully.',
      data: newPost,
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
        message: "User ID is required.",
      });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ["firstName", "lastName"],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Invalid User ID.",
      });
    }

    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    // Fetch user posts with pagination
    const [userPosts, totalPosts] = await userPostRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!userPosts || userPosts.length === 0) {
      return res.status(200).json({ status: "success", message: "No posts found for this user.", data: { posts: [] } });
    }

    const postIds = userPosts.map((post) => post.Id);

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
        postId: post.Id,
        mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key))) : [],
      }))
    );

    // Format comments for each post
    const postComments = await commentRepository.find({
      where: { postId: In(postIds) },
      order: { createdAt: "ASC" },
      take: 5, // Limit comments per post
    });

    const formattedComments = await Promise.all(
      postComments.map(async (comment) => {
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
          select: ["firstName", "lastName"],
        });

        return {
          Id: comment.id,
          commenterName: `${commenter?.firstName || ""} ${commenter?.lastName || ""}`,
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          postId: comment.postId,
        };
      })
    );

    // Format posts with related data
    const formattedPosts = userPosts.map((post) => {
      const mediaUrls = mediaKeysWithUrls.find((media) => media.postId === post.Id)?.mediaUrls || [];
      const likeCount = likes.filter((like) => like.postId === post.Id).length;
      const commentCount = comments.filter((comment) => comment.postId === post.Id).length;
      const likeStatus = likes.some((like) => like.postId === post.Id && like.userId === userId);

      return {
        post: {
          Id: post.Id,
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
        comments: formattedComments.filter((comment) => comment.postId === post.Id),
      };
    });

    return res.status(200).json({
      message: "User posts retrieved successfully.",
      data: {
        posts: formattedPosts,
        totalPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal server error. Could not retrieve user posts.",
      error: error.message,
    });
  }
};
// find and update user post
export const UpdateUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, Id, title, content, hashtags, mentionId, mediaIds, likeIds, commentIds, shareIds } = req.body;

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
    const userPost = await UserPost.findOne({ where: { Id } });

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
    const userPost = await UserPost.findOne({ where: { Id: PostId } });

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
// Get all posts for public view
export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, page, limit = 5 } = req.body;

    // Get the repositories
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    // Get all posts with pagination
    const posts = await userPostRepository.find({
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      select: ['Id', 'userId', 'title', 'content', 'hashtags', 'mediaKeys', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!posts || posts.length === 0) {
      return res.status(200).json({ status: "success", message: "No posts found for this user.", data: { posts: [] } });
    }

    const postIds = posts.map((post) => post.Id);

    // Fetch comments and likes for the posts
    const comments = await commentRepository.find({
      where: { postId: In(postIds) },
    });

    const likes = await likeRepository.find({
      where: { postId: In(postIds) },
    });

    // Generate media URLs for posts
    const mediaKeysWithUrls = await Promise.all(
      posts.map(async (post) => ({
        postId: post.Id,
        mediaUrls: post.mediaKeys
          ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key)))
          : [],
      }))
    );

    const getLikeStatus = async (postId: string) => {
      const like = await likeRepository.findOne({ where: { userId, postId } });
      return like?.status;
    }

    // Format the posts with user details, likes, and comments
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Fetch media URLs related to the post
        const mediaUrls =
          mediaKeysWithUrls.find((media) => media.postId === post.Id)?.mediaUrls || [];

        // Calculate like count and comment count
        const likeCount = likes.filter((like) => like.postId === post.Id).length;
        const commentCount = comments.filter((comment) => comment.postId === post.Id).length;
        const likeStatus = await getLikeStatus(post.Id);


        // Fetch top 5 comments for the post
        const postComments = await commentRepository.find({
          where: { postId: post.Id },
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
              commenter
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
            Id: post.Id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            mediaUrls: mediaUrls,
            likeCount,
            commentCount,
            likeStatus,
          },
          userDetails: {
            postedId: user?.id,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            timestamp: formatTimestamp(post.createdAt),
            userRole: user?.userRole,
            avatar: user?.profilePictureUploadId
              ? await generatePresignedUrl(user.profilePictureUploadId)
              : null,
          },
          comments: formattedComments,
        };
      })
    );

    // Return the formatted posts
    return res.status(200).json({
      message: 'User posts retrieved successfully.',
      data: formattedPosts,
    });
  } catch (error: any) {
    // Handle and log errors
    return res.status(500).json({
      message: 'Internal server error. Could not fetch posts.',
      error: error.message,
    });
  }
};


