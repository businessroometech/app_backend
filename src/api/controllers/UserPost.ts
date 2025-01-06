import { Request, Response } from 'express';
import { UserPost } from '../entity/UserPost';
import { AppDataSource } from '@/server';
import { UserLogin } from '../entity/user/UserLogin';
import { PersonalDetails } from '../entity/personal/PersonalDetails';


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
    // const userRepos = AppDataSource.getRepository(PersonalDetails);
    // const user = await userRepos.findOneBy({ userId });
    // if (!user) {
    //   return res.status(400).json({
    //     message: 'User ID is invalid or does not exist.',
    //   });
    // }

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

// FindUserPost by userId
export const FindUserPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    // Get the PersonalDetails repository
    const userRepository = AppDataSource.getRepository(PersonalDetails);

    // Check if the user exists
    const user = await userRepository.findOne({
      where: { userId },
      select: ['profilePictureUploadId', 'firstName', 'lastName', 'bio', "occupation"],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Invalid User ID.',
      });
    }

    // Find the user's posts
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const userPosts = await userPostRepository.find({
      where: { userId },
    });

    if (!userPosts || userPosts.length === 0) {
      return res.status(404).json({
        message: 'No posts found for this user.',
      });
    }

    // Format the posts with user details
    const formattedPosts = userPosts.map((post) => ({
      ...post,
      userDetails: {
        profilePictureUploadId: user.profilePictureUploadId,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        occupation: user.occupation,
      },
      timestamp: formatTimestamp(post.createdAt), // Call the utility function for formatting
      likeCount: post.likeIds?.length || 0,
      commentCount: post.commentIds?.length || 0,
      shareCount: post.shareIds?.length || 0,
    }));

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
     // Get the PersonalDetails repository
     const userRepository = AppDataSource.getRepository(PersonalDetails);

     // Check if the user exists
     const user = await userRepository.findOne({
       where: { userId },
       select: ['profilePictureUploadId', 'firstName', 'lastName', 'bio', "occupation"],
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

    // Check if the user ID exists in the PersonalDetails repository
    // const userRepos = AppDataSource.getRepository(PersonalDetails);
    // const user = await userRepos.findOneBy({ userId });
    // if (!user) {
    //   return res.status(400).json({
    //     message: 'User ID is invalid or does not exist.',
    //   });
    // }

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

     // Get the PersonalDetails repository
     const userRepository = AppDataSource.getRepository(PersonalDetails);

     // Check if the user exists
     const user = await userRepository.findOne({
       where: { userId },
       select: ['profilePictureUploadId', 'firstName', 'lastName', 'bio', "occupation"],
     });
 
     if (!user) {
       return res.status(404).json({
         message: 'User not found. Invalid User ID.',
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

    // Format the posts with user details
    const formattedPosts = posts.map((post) => ({
      ...post,
      userDetails: {
        profilePictureUploadId: user.profilePictureUploadId,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        occupation: user.occupation,
      },
      timestamp: formatTimestamp(post.createdAt), 
      likeCount: post.likeIds?.length || 0,
      commentCount: post.commentIds?.length || 0,
      shareCount: post.shareIds?.length || 0,
    }));

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
