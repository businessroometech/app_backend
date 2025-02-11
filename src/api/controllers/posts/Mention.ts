import { Request, Response } from 'express';
import { Like } from 'typeorm';
import { generatePresignedUrl } from '../s3/awsControllers';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { Mention } from '@/api/entity/posts/Mention';
import { UserPost } from '@/api/entity/UserPost';
import { Connection } from '@/api/entity/connection/Connections';
import { NestedComment } from '@/api/entity/posts/NestedComment';

export const suggestUsersByEmail = async (req: Request, res: Response): Promise<Response> => {
  try { 
    const { query, userId } = req.body; 

    // Validate input
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'UserId parameter is required.',
      });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepo = AppDataSource.getRepository(Connection);

    let users;

    if (!query || typeof query !== 'string') {
      // If query is empty, fetch all users (limit 10)
      users = await userRepository.find({
        select: ['id', 'emailAddress', 'firstName', 'lastName', 'profilePictureUploadId', "userRole", "userName"],
     
      });
    } else {
      // Fetch users based on search query
      users = await userRepository.find({
        where: [
          { emailAddress: Like(`%${query}%`) },
          { firstName: Like(`%${query}%`) },
          { lastName: Like(`%${query}%`) },
          { userName: Like(`%${query}%`) },
        ],
        select: ['id', 'emailAddress', 'firstName', 'lastName', 'profilePictureUploadId', "userRole", "userName"],
    
      });
    }

    // Fetch user's connections where status is 'accepted'
    const connections = await connectionRepo.find({
      where: [
        { receiverId: userId, status: "accepted" },
        { requesterId: userId, status: "accepted" }
      ]
    });

    // Extract connected user IDs
    const connectedUserIds = new Set([
      userId, 
      ...connections.map((conn) => (conn.requesterId === userId ? conn.receiverId : conn.requesterId)),
    ]);
    
    const suggestions = await Promise.all(
      users
        .filter(user => connectedUserIds.has(user.id)) 
        .map(async (user) => ({
          id: user.id,
          emailAddress: user.emailAddress,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          avatar: user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
          userRole: user.userRole,
          userName: user.userName
        }))
    );

    return res.status(200).json({
      status: 'success',
      message: 'User suggestions retrieved successfully.',
      data: suggestions,
    });
  } catch (error: any) {
    // Handle errors
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Could not fetch user suggestions.',
      error: error.message,
    });
  }
};



export const createMention = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { users, posts, mentionBy, mentionTo } = req.body;
  
      // Validate request body
      if (!mentionBy || !mentionTo || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'mentionBy, mentionTo, and users (array) are required.',
        });
      }
  
      if (!Array.isArray(posts) || posts.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Posts (array) must be provided.',
        });
      }
  
      const mentionRepository = AppDataSource.getRepository(Mention);
      const userRepository = AppDataSource.getRepository(PersonalDetails);
      const postRepository = AppDataSource.getRepository(UserPost);
  
      // Validate mentioned users
      const mentionedUsers = await userRepository.findByIds(users);
      if (mentionedUsers.length !== users.length) {
        return res.status(404).json({
          status: 'error',
          message: 'One or more mentioned users do not exist.',
        });
      }
  
      // Validate posts
      const relatedPosts = await postRepository.findByIds(posts);
      if (relatedPosts.length !== posts.length) {
        return res.status(404).json({
          status: 'error',
          message: 'One or more posts do not exist.',
        });
      }
  
      // Create mention records
      const mentions = users.map((user, index) => mentionRepository.create({
        user: mentionedUsers[index],
        post: relatedPosts[index % relatedPosts.length],
        mentionBy,
        mentionTo,
        createdBy: mentionBy,
        updatedBy: mentionBy,
      }));
  
      // Save mentions to the database
      const savedMentions = await mentionRepository.save(mentions);
  
      return res.status(201).json({
        status: 'success',
        message: 'Mentions created successfully.',
        data: savedMentions,
      });
    } catch (error: any) {
      // Handle errors
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error. Could not create mention.',
        error: error.message,
      });
    }
  };


  interface CreateMentionParams {
    userId: string;
    postId?: string;
    commentId?: string;
    nestedCommentId?: string;
    mentionBy: string;
    mentionTo: string;
  }
  
  export const CreateMention = async ({
    userId,
    postId,
    commentId,
    nestedCommentId,
    mentionBy,
    mentionTo,
  }: CreateMentionParams): Promise<{ status: string; message: string; data?: Mention }> => {
    try {
      if (!mentionBy || !mentionTo || !userId) {
        return {
          status: 'error',
          message: 'mentionBy, mentionTo, and userId are required.',
        };
      }
  
      const mentionRepository = AppDataSource.getRepository(Mention);
      const userRepository = AppDataSource.getRepository(PersonalDetails);
      const postRepository = AppDataSource.getRepository(UserPost);
      const commentRepository = AppDataSource.getRepository(Comment);
      const nestedCommentRepository = AppDataSource.getRepository(NestedComment);
  
      // Validate user existence
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return { status: 'error', message: 'User does not exist.' };
      }
  
      let post: UserPost | null = null;
      let comment: Comment | null = null;
      let nestedComment: NestedComment | null = null;
  
      // Validate Post
      if (postId) {
        post = await postRepository.findOne({ where: { id: postId } });
        if (!post) return { status: 'error', message: 'Post does not exist.' };
      }
  
      // Validate Comment
      if (commentId) {
        comment = await commentRepository.findOne({ where: { id: commentId } });
        if (!comment) return { status: 'error', message: 'Comment does not exist.' };
      }
  
      // Validate Nested Comment
      if (nestedCommentId) {
        nestedComment = await nestedCommentRepository.findOne({ where: { id: nestedCommentId } });
        if (!nestedComment) return { status: 'error', message: 'Nested comment does not exist.' };
      }
  
      // Create and Save Mention
      const mention = mentionRepository.create({
        userId,
        post,
        comment,
        nestedComment,
        mentionBy,
        mentionTo,
        createdBy: mentionBy,
        updatedBy: mentionBy,
      });
  
      const savedMention = await mentionRepository.save(mention);
  
      return {
        status: 'success',
        message: 'Mention created successfully.',
        data: savedMention[0],
      };
    } catch (error: any) {
      console.error('CreateMention Error:', error);
      return { status: 'error', message: `Failed to create mention: ${error.message}` };
    }
  };
  