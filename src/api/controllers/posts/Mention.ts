import { Request, Response } from 'express';
import { Like } from 'typeorm';
import { generatePresignedUrl } from '../s3/awsControllers';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { Mention } from '@/api/entity/posts/Mention';
import { UserPost } from '@/api/entity/UserPost';
import { Connection } from '@/api/entity/connection/Connections';

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



// export const createMention = async (req: Request, res: Response): Promise<Response> => {
//     try {
//       const { users, posts, mentionBy, mentionTo } = req.body;
  
//       // Validate request body
//       if (!mentionBy || !mentionTo || !Array.isArray(users) || users.length === 0) {
//         return res.status(400).json({
//           status: 'error',
//           message: 'mentionBy, mentionTo, and users (array) are required.',
//         });
//       }
  
//       if (!Array.isArray(posts) || posts.length === 0) {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Posts (array) must be provided.',
//         });
//       }
  
//       const mentionRepository = AppDataSource.getRepository(Mention);
//       const userRepository = AppDataSource.getRepository(PersonalDetails);
//       const postRepository = AppDataSource.getRepository(UserPost);
  
//       // Validate mentioned users
//       const mentionedUsers = await userRepository.findByIds(users);
//       if (mentionedUsers.length !== users.length) {
//         return res.status(404).json({
//           status: 'error',
//           message: 'One or more mentioned users do not exist.',
//         });
//       }
  
//       // Validate posts
//       const relatedPosts = await postRepository.findByIds(posts);
//       if (relatedPosts.length !== posts.length) {
//         return res.status(404).json({
//           status: 'error',
//           message: 'One or more posts do not exist.',
//         });
//       }
  
//       // Create mention records
//       const mention = mentionRepository.create({
//         users: mentionedUsers,
//         posts: relatedPosts,
//         mentionBy,
//         mentionTo,
//         createdBy: mentionBy,
//         updatedBy: mentionBy,
//       });
  
//       // Save mention to the database
//       const savedMention = await mentionRepository.save(mention);
  
//       return res.status(201).json({
//         status: 'success',
//         message: 'Mention created successfully.',
//         data: savedMention,
//       });
//     } catch (error: any) {
//       // Handle errors
//       return res.status(500).json({
//         status: 'error',
//         message: 'Internal server error. Could not create mention.',
//         error: error.message,
//       });
//     }
//   };