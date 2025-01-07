import { Request, Response } from 'express';
import { In } from 'typeorm';

import { AppDataSource } from '@/server';

import { PersonalDetails } from '../entity/personal/PersonalDetails';
import { Comment } from '../entity/posts/Comment';
import { Like } from '../entity/posts/Like';
import { UserLogin } from '../entity/user/UserLogin';
import { UserPost } from '../entity/UserPost';
import { generatePresignedUrl } from './s3/awsControllers';

// Utility function to format the timestamp (e.g., "2 seconds ago", "3 minutes ago")
const formatTimestamp = (createdAt: Date): string => {
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
    const userRepos = AppDataSource.getRepository(UserLogin);
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
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    const userRepository = AppDataSource.getRepository(UserLogin);
    const user = await userRepository.findOne({
      where: { id: userId },
      select: [
        // 'profilePictureUploadId',
        'firstName',
        'lastName',
        // 'bio', 'occupation'
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Invalid User ID.',
      });
    }

    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    // Fetch user posts
    const userPosts = await userPostRepository.find({
      where: { userId },
    });

    // Check if posts exist
    if (!userPosts || userPosts.length === 0) {
      return res.status(404).json({ message: 'No posts found for this user.' });
    }

    const postIds = userPosts.map((post) => post.Id);
    const comments = await commentRepository.find({
      where: { postId: In(postIds) },
    });

    const likes = await likeRepository.find({
      where: { postId: In(postIds) },
    });

    const mediaKeysWithUrls = await Promise.all(
      userPosts.map(async (post) => ({
        postId: post.Id,
        mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key))) : [],
      }))
    );

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
          likeStatus, // true or false based on whether the user has liked the post
        },
        userDetails: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          timestamp: formatTimestamp(post.createdAt),
        },
      };
    });
    return res.status(200).json({
      message: 'User posts retrieved successfully.',
      data: formattedPosts,
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
    const { userId, Id, title, content, hashtags, mentionId, mediaIds, likeIds, commentIds, shareIds } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    // Get the PersonalDetails repository
    const userRepository = AppDataSource.getRepository(PersonalDetails);

    // Check if the user exists
    const user = await userRepository.findOne({
      where: { userId },
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
export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.body;

    // Validate the userId
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    // Get the UserLogin repository
    const userRepository = AppDataSource.getRepository(UserLogin);

    // Check if the user exists
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['firstName', 'lastName'],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Invalid User ID.',
      });
    }

    // Get all posts
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    const posts = await userPostRepository.find({
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      select: ['Id', 'userId', 'title', 'content', 'hashtags', 'mediaKeys'],
    });

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        message: 'No posts found.',
      });
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
        mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key))) : [],
      }))
    );

    // Format the posts with user details, likes, and comments
    const formattedPosts = posts.map((post) => {
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
          likeStatus, // true or false based on whether the user has liked the post
        },
        userDetails: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          timestamp: formatTimestamp(post.createdAt),
        },
      };
    });

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
