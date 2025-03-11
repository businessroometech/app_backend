import { Request, Response } from 'express';

import { Connection } from '@/api/entity/connection/Connections';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { ILike } from 'typeorm';
import { UserPost } from '@/api/entity/UserPost';
import { AppDataSource } from '@/server';

import { generatePresignedUrl, uploadBufferDocumentToS3 } from '../s3/awsControllers';
import { ProfileVisit } from '@/api/entity/notifications/ProfileVisit';
import { sendNotification } from '../notifications/SocketNotificationController';
import { Like } from '@/api/entity/posts/Like';
import { BlockedUser } from '@/api/entity/posts/BlockedUser';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const formatTimestamp = (createdAt: Date): string => {
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

export const UpdateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      occupation,
      firstName,
      lastName,
      dob,
      mobileNumber,
      emailAddress,
      bio,
      gender,
      investorType,
      isBadgeOn,
      badgeName,
      experience
    } = req.body;

    const userId = req.userId;
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({ message: "User ID is invalid or does not exist." });
    }

    // Fetch user details
    const personalDetails = await userRepository.findOneBy({ id: userId });

    if (personalDetails) {
      // Update basic profile fields
      if (occupation !== undefined) personalDetails.occupation = occupation;
      if (firstName !== undefined) personalDetails.firstName = firstName;
      if (lastName !== undefined) personalDetails.lastName = lastName;
      if (dob !== undefined) personalDetails.dob = dob;
      if (experience !== undefined) personalDetails.experience = experience;
      if (mobileNumber !== undefined) personalDetails.mobileNumber = mobileNumber;
      if (emailAddress !== undefined) personalDetails.emailAddress = emailAddress;
      if (bio !== undefined) personalDetails.bio = bio;
      if (gender !== undefined) personalDetails.gender = gender;
      if (investorType !== undefined) personalDetails.investorType = investorType;
      if (isBadgeOn !== undefined) {
        personalDetails.isBadgeOn = isBadgeOn;
        personalDetails.badgeName = badgeName;
      }

      // Check for profile photo & cover photo in req.files
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (files.profilePhoto && files.profilePhoto.length > 0) {
          try {
            console.log("Uploading profile photo:", files.profilePhoto[0].originalname);
            const profilePhotoKey = await uploadBufferDocumentToS3(
              files.profilePhoto[0].buffer,
              userId,
              files.profilePhoto[0].mimetype
            );
            personalDetails.profilePictureUploadId = profilePhotoKey.fileKey;
          } catch (uploadError) {
            console.error("Profile photo upload error:", uploadError);
          }
        }

        if (files.coverPhoto && files.coverPhoto.length > 0) {
          try {
            console.log("Uploading cover photo:", files.coverPhoto[0].originalname);
            const coverPhotoKey = await uploadBufferDocumentToS3(
              files.coverPhoto[0].buffer,
              userId,
              files.coverPhoto[0].mimetype
            );
            personalDetails.bgPictureUploadId = coverPhotoKey.fileKey;
          } catch (uploadError) {
            console.error("Cover photo upload error:", uploadError);
          }
        }

        if (files.documents && Array.isArray(files.documents)) {
          for (const file of files.documents) {
            try {
              console.log("Uploading document:", file.originalname);
              await uploadBufferDocumentToS3(file.buffer, userId, file.mimetype);
            } catch (uploadError) {
              console.error("S3 Upload Error:", uploadError);
            }
          }
        }
      }

      personalDetails.updatedBy = "system";

      await userRepository.save(personalDetails);

      return res.status(200).json({
        message: "User profile updated successfully.",
        data: personalDetails,
      });
    }
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// get user profile
export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    let { profileId = userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID and Profile ID are required.',
      });
    }

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const postRepository = AppDataSource.getRepository(UserPost);
    const likeRepository = AppDataSource.getRepository(Like);
    const blockedUserRepository = AppDataSource.getRepository(BlockedUser);

    // Check if the user is blocked or has blocked the profile
    const blockedEntry = await blockedUserRepository.findOne({
      where: [
        { blockedBy: userId, blockedUser: String(profileId) },
        { blockedBy: String(profileId), blockedUser: userId },
      ],
    });

    // Fetch user details
    const personalDetails = await personalDetailsRepository.findOne({
      where: { id: String(profileId) },
    });

    if (!personalDetails) {
      return res.status(404).json({
        message: 'User profile not found.',
      });
    }

    // Generate image URLs
    const profileImgUrl = personalDetails.profilePictureUploadId
      ? await generatePresignedUrl(personalDetails.profilePictureUploadId)
      : null;

    const coverImgUrl = personalDetails.bgPictureUploadId
      ? await generatePresignedUrl(personalDetails.bgPictureUploadId)
      : null;

    // Fetch connection, post, and like counts
    const connectionsCount = await connectionRepository.count({
      where: [
        { requesterId: String(profileId), status: 'accepted' },
        { receiverId: String(profileId), status: 'accepted' },
      ],
    });

    const postsCount = await postRepository.count({ where: { userId: String(profileId) } });
    const likeCount = await likeRepository.count({ where: { userId: String(profileId) } });

    const connectionsStatus = await connectionRepository.findOne({
      where: [
        { requesterId: userId, receiverId: String(profileId) },
        { receiverId: userId, requesterId: String(profileId) },
      ],
    });

    if (blockedEntry) {
      if (blockedEntry.blockedBy === userId) {
        return res.status(200).json({
          message: 'You have blocked this user.',
          data: { personalDetails, connectionsStatus: "Blocked", unblockOption: true, }
        });
      } else {
        return res.status(200).json({
          message: 'You are blocked from viewing this profile.',
          data: { personalDetails, connectionsStatus: "Blocked", }
        });
      }
    }

    return res.status(200).json({
      message: 'User profile fetched successfully.',
      data: {
        personalDetails,
        profileImgUrl,
        coverImgUrl,
        connectionsCount,
        postsCount,
        likeCount,
        connectionsStatus: connectionsStatus ? connectionsStatus.status : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const ProfileVisitController = {
  /**
   * Record a profile visit
   */
  recordVisit: async (req: Request, res: Response) => {
    try {
      const { visitorId, visitedId } = req.body;

      if (visitorId === visitedId) {
        return res.status(400).json({ message: 'You cannot visit your own profile.' });
      }

      const userRepository = AppDataSource.getRepository(PersonalDetails);

      const visitor = await userRepository.findOneBy({ id: visitorId });
      const visited = await userRepository.findOneBy({ id: visitedId });

      if (!visitor || !visited) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const profileVisitRepository = AppDataSource.getRepository(ProfileVisit);

      const profileVisit = new ProfileVisit();
      profileVisit.visitor = visitor;
      profileVisit.visited = visited;

      await profileVisitRepository.save(profileVisit);

      if (visited.id !== visitor.id) {
        await sendNotification(
          visitedId,
          `${visitor.firstName} ${visitor.lastName} viewed your profile.`,
          visitor?.profilePictureUploadId,
          `/profile/feed/${visitor?.id}`
        );
      }

      return res.status(201).json({ message: 'Profile visit recorded successfully.' });
    } catch (error: any) {
      console.error('Error recording profile visit:', error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  },

  // Method for fetching profile visits
  getMyProfileVisits: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const profileVisitRepository = AppDataSource.getRepository(ProfileVisit);
      const connectionRepository = AppDataSource.getRepository(Connection);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const visits = await profileVisitRepository
        .createQueryBuilder('profileVisit')
        .select('profileVisit.visitor', 'visitorId')
        .addSelect('profileVisit.createdAt', 'createdAt')
        .addSelect('profileVisit.updatedAt', 'updatedAt')
        .addSelect('COUNT(profileVisit.id)', 'visitCount')
        .where('profileVisit.visited = :userId AND profileVisit.visitedAt >= :oneWeekAgo', { userId, oneWeekAgo })
        .groupBy('profileVisit.visitor')
        .orderBy('MAX(profileVisit.visitedAt)', 'DESC')
        .offset((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .getRawMany();

      const visitors = await Promise.all(
        visits.map(async (visit) => {
          const visitor = await AppDataSource.getRepository(PersonalDetails).findOne({
            where: { id: visit.visitorId },
            select: ['id', 'firstName', 'lastName', 'profilePictureUploadId', 'userRole', 'createdAt', 'updatedAt'],
          });

          // Fetch the connection status between the current user and the visitor
          const connection = await connectionRepository
            .createQueryBuilder('connection')
            .select('connection.status', 'status')
            .where(
              '(connection.requesterId = :userId AND connection.receiverId = :visitorId) OR (connection.requesterId = :visitorId AND connection.receiverId = :userId)',
              { userId, visitorId: visit.visitorId }
            )
            .getRawOne();

          const profilePicture = visitor?.profilePictureUploadId
            ? await generatePresignedUrl(visitor?.profilePictureUploadId)
            : null;

          const visitedAt = visit.updatedAt ? formatTimestamp(visit.updatedAt) : formatTimestamp(visit.createdAt);
          return {
            visitor: { ...visitor, profilePicture, visitedAt },
            visitCount: parseInt(visit.visitCount, 10),
            connectionStatus: connection?.status || 'none',
          };
        })
      );

      return res.status(200).json({
        message: 'Profile visits fetched successfully.',
        data: visitors,
        pagination: { page, limit },
      });
    } catch (error: any) {
      console.error('Error fetching profile visits:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  },

  // Method for fetching profiles the user has visited
  getProfilesIVisited: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const profileVisitRepository = AppDataSource.getRepository(ProfileVisit);
      const connectionRepository = AppDataSource.getRepository(Connection);

      // Calculate the date one week ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Aggregate visits and count the number of times each profile was visited
      const visits = await profileVisitRepository
        .createQueryBuilder('profileVisit')
        .select('profileVisit.visited', 'visitedId')
        .addSelect('profileVisit.createdAt', 'createdAt')
        .addSelect('profileVisit.updatedAt', 'updatedAt')
        .addSelect('COUNT(profileVisit.id)', 'visitCount')
        .where('profileVisit.visitor = :userId AND profileVisit.visitedAt >= :oneWeekAgo', { userId, oneWeekAgo })
        .groupBy('profileVisit.visited')
        .orderBy('MAX(profileVisit.visitedAt)', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany();

      const visitedProfiles = await Promise.all(
        visits.map(async (visit) => {
          const profile = await AppDataSource.getRepository(PersonalDetails).findOne({
            where: { id: visit.visitedId },
            select: ['id', 'firstName', 'lastName', 'profilePictureUploadId', 'userRole', 'createdAt'],
          });

          // Fetch the connection status between the current user and the visited profile
          const connection = await connectionRepository
            .createQueryBuilder('connection')
            .select('connection.status', 'status')
            .where(
              '(connection.requesterId = :userId AND connection.receiverId = :visitedId) OR (connection.requesterId = :visitedId AND connection.receiverId = :userId)',
              { userId, visitedId: visit.visitedId }
            )
            .getRawOne();

          const profilePicture = profile?.profilePictureUploadId
            ? await generatePresignedUrl(profile.profilePictureUploadId)
            : null;
          const visitedAt = visit.updatedAt ? formatTimestamp(visit.updatedAt) : formatTimestamp(visit.createdAt);
          return {
            profile: { ...profile, profilePicture, visitedAt },
            visitCount: parseInt(visit.visitCount, 10),
            connectionStatus: connection?.status || 'none',
          };
        })
      );

      return res.status(200).json({
        message: 'Profiles visited fetched successfully.',
        data: visitedProfiles,
        pagination: { page, limit },
      });
    } catch (error: any) {
      console.error('Error fetching profiles visited:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
      });
    }
  },
};

// search user profile
export const searchUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const searchQuery = req.query.search;

    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const blockedUserRepository = AppDataSource.getRepository(BlockedUser);
    const connectionRepository = AppDataSource.getRepository(Connection);

    // Fetch users matching the search query
    const searchResults = await personalDetailsRepository.find({
      where: [
        { firstName: ILike(`%${searchQuery}%`) },
        { lastName: ILike(`%${searchQuery}%`) },
        { emailAddress: ILike(`%${searchQuery}%`) },
      ],
    });

    if (searchResults.length === 0) {
      return res.status(204).json({ message: 'No results found.' });
    }

    // Fetch blocked users where either userId is the blocker or is blocked
    const blockedUsers = await blockedUserRepository.find({
      where: [{ blockedBy: userId }, { blockedUser: userId }],
    });

    // Create a Set of users that are either blocked by the user or have blocked the user
    const blockedUserIds = new Set(
      blockedUsers.flatMap((block) => [block.blockedBy, block.blockedUser])
    );

    // Filter results: Remove blocked users and prevent self-inclusion
    const filteredResults = await Promise.all(
      searchResults
        .filter((result) => result.id !== userId && !blockedUserIds.has(result.id)) // Remove blocked profiles
        .map(async (result) => {
          // Fetch mutual connections count
          const mutualConnectionCount = await connectionRepository.count({
            where: [
              { requesterId: userId, receiverId: result.id, status: 'accepted' },
              { requesterId: result.id, receiverId: userId, status: 'accepted' },
            ],
          });

          // Generate profile image URL if available
          const profileImgUrl = result.profilePictureUploadId
            ? await generatePresignedUrl(result.profilePictureUploadId)
            : null;

          return {
            id: result.id,
            firstName: result.firstName,
            lastName: result.lastName,
            emailAddress: result.emailAddress,
            userRole: result.userRole,
            profileImgUrl,
            mutualConnectionCount,
            isBadgeOn: result.isBadgeOn,
            badgeName: result.badgeName
          };
        })
    );

    return res.status(200).json({
      message: 'Search results fetched successfully.',
      data: filteredResults,
    });
  } catch (error: any) {
    console.error('Error searching user profile:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};


// find user by userName
export const findUserByUserName = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userName } = req.body;

    if (!userName) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await personalDetailsRepository.findOne({ where: { userName } });

    if (!user) {
      return res.status(404).json({ message: 'User not available.' });
    }

    return res.status(200).json({
      message: 'User found successfully.',
      data: user,
    });
  } catch (error: any) {
    console.error('Error finding user by username:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};