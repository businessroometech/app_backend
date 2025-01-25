import { Request, Response } from 'express';
import { Like } from 'typeorm';
import { generatePresignedUrl } from '../s3/awsControllers';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';

export const suggestUsersByEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { query } = req.body; 

    // Validate input
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter is required and must be a string.',
      });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const users = await userRepository.find({
      where: [
        { emailAddress: Like(`%${query}%`) }, 
        { firstName: Like(`%${query}%`) },   
        { lastName: Like(`%${query}%`) },    
      ],
      select: ['id', 'emailAddress', 'firstName', 'lastName', 'profilePictureUploadId'], 
      take: 10, 
    });

    // Format the results
    const suggestions = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        emailAddress: user.emailAddress,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        avatar: user.profilePictureUploadId
          ? await generatePresignedUrl(user.profilePictureUploadId) 
          : null,
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
