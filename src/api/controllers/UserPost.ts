import { Request, Response } from 'express';
import { UserPost } from '../entity/UserPost';
import { AppDataSource } from '@/server';
import { UserLogin } from '../entity/user/UserLogin';


// user post and and update post
export const CreateUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      userId,
      title,
      content,
      hashtags,
      mentionId,
      mediaIds,
      likeIds,
      commentIds,
      shareIds,
    } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    const userRepos = AppDataSource.getRepository(UserLogin);
    const user = await userRepos.findOneBy({ id:userId });
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
      mentionId,
      mediaIds, 
      likeIds,
      commentIds,
      shareIds,
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

// find user post
export const FindUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    const userRepos = AppDataSource.getRepository(UserLogin);
    const user = await userRepos.findOneBy({ id: userId });
    if (!user) {
      return res.status(400).json({
        message: 'User ID is invalid or does not exist.',
      });
    }

    // Find the user post
    const userPost = await UserPost.find({ where: { userId } });

    return res.status(200).json({
      message: 'User post found successfully.',
      // data: userPost,
      data: userPost.map(post => ({
        ...post,
        likeCount: post.likeIds?.length || 0,
        commentCount: post.commentIds?.length || 0,
        shareCount: post.shareIds?.length || 0,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not find user post.',
      error: error.message,
    });
  }
};

// find and update user post
export const UpdateUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      userId,
        Id,
      title,
      content,
      hashtags,
      mentionId,
      mediaIds,
      likeIds,
      commentIds,
      shareIds,
    } = req.body;

    // Check if the user ID exists in the PersonalDetails repository
    const userRepos = AppDataSource.getRepository(UserLogin);
    const user = await userRepos.findOneBy({id: userId });
    if (!user) {
      return res.status(400).json({
        message: 'User ID is invalid or does not exist.',
      });
    }

    // Find the user post
    const userPost = await UserPost.findOne({ where: { Id } });

    // Update the user post
    userPost!.title = title;
    userPost!.content = content;
    userPost!.hashtags = hashtags;
    userPost!.mentionId = mentionId;
    userPost!.mediaIds = mediaIds;
    userPost!.likeIds = likeIds;
    userPost!.commentIds = commentIds;
    userPost!.shareIds = shareIds;

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
    // Find the user post
    const userPost = await UserPost.findOne({ where: { Id:PostId } });
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

// get all post for public view
export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }
    const posts = await UserPost.find({
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      select: [
        'Id',
        'userId',
        'title',
        'content',
        'hashtags',
        'mentionId',
        'mediaIds',
        'likeIds',
        'commentIds',
        'shareIds',
        'createdAt',
        'updatedAt',
      ],
    });
    return res.status(200).json({
      message: 'Posts fetched successfully.',
      data: posts.map(post => ({
        ...post,
        likeCount: post.likeIds?.length || 0,
        commentCount: post.commentIds?.length || 0,
        shareCount: post.shareIds?.length || 0,
      })),
    });
  } catch (error: any) {
    // Handle and log errors
    return res.status(500).json({
      message: 'Internal server error. Could not fetch posts.',
      error: error.message,
    });
  }
};
