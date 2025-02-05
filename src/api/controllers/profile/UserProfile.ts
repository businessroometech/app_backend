import { Request, Response } from 'express';

import { Connection } from '@/api/entity/connection/Connections';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { ILike } from 'typeorm';
import { UserPost } from '@/api/entity/UserPost';
import { AppDataSource } from '@/server';

import { generatePresignedUrl } from '../s3/awsControllers';
import { ProfileVisit } from '@/api/entity/notifications/ProfileVisit';
import { sendNotification } from '../notifications/SocketNotificationController';
import { Like } from '@/api/entity/posts/Like';

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

export const UpdateUserProfile = async (req: Request, res: Response) => {
  try {
    const {
      occupation,
      userId,
      profilePictureUploadId,
      bgPictureUploadId,
      firstName,
      lastName,
      dob,
      mobileNumber,
      emailAddress,
      bio,
      gender,
      preferredLanguage,
      socialMediaProfile,
      height,
      weight,
      permanentAddress,
      currentAddress,
      aadharNumberUploadId,
      panNumberUploadId,
      zoom,
      rotate,
      zoomProfile,
      rotateProfile,
    } = req.body;

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({
        message: 'User ID is invalid or does not exist.',
      });
    }

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const personalDetails = await personalDetailsRepository.findOneBy({ id: userId });

    if (personalDetails) {
      // Only update fields that are provided in the request body, excluding the password
      if (occupation !== undefined) personalDetails.occupation = occupation;
      if (profilePictureUploadId !== undefined) personalDetails.profilePictureUploadId = profilePictureUploadId;
      if (bgPictureUploadId !== undefined) personalDetails.bgPictureUploadId = bgPictureUploadId;
      if (firstName !== undefined) personalDetails.firstName = firstName;
      if (lastName !== undefined) personalDetails.lastName = lastName;
      if (dob !== undefined) personalDetails.dob = dob;
      if (mobileNumber !== undefined) personalDetails.mobileNumber = mobileNumber;
      if (emailAddress !== undefined) personalDetails.emailAddress = emailAddress;
      if (bio !== undefined) personalDetails.bio = bio;
      if (gender !== undefined) personalDetails.gender = gender;
      if (preferredLanguage !== undefined) personalDetails.preferredLanguage = preferredLanguage;
      if (socialMediaProfile !== undefined) personalDetails.socialMediaProfile = socialMediaProfile;
      if (height !== undefined) personalDetails.height = height;
      if (weight !== undefined) personalDetails.weight = weight;
      if (permanentAddress !== undefined) personalDetails.permanentAddress = permanentAddress;
      if (currentAddress !== undefined) personalDetails.currentAddress = currentAddress;
      if (aadharNumberUploadId !== undefined) personalDetails.aadharNumberUploadId = aadharNumberUploadId;
      if (panNumberUploadId !== undefined) personalDetails.panNumberUploadId = panNumberUploadId;
      if (zoom !== undefined) personalDetails.zoom = zoom;
      if (rotate !== undefined) personalDetails.rotate = rotate;
      if (zoomProfile !== undefined) personalDetails.zoomProfile = zoomProfile;
      if (rotateProfile !== undefined) personalDetails.rotateProfile = rotateProfile;
      personalDetails.updatedBy = 'system';

      await personalDetailsRepository.save(personalDetails);

      return res.status(200).json({
        message: 'User profile updated successfully.',
        data: personalDetails,
      });
    }
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

// get user profile
export const getUserProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, profileId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    // Fetch user details from the PersonalDetails repository
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const personalDetails = await personalDetailsRepository.findOne({
      where: { id: userId },
    });

    if (!personalDetails) {
      return res.status(404).json({
        message: 'User profile not found.',
      });
    }

    // Generate URLs for profile and cover images
    const profileImgUrl = personalDetails.profilePictureUploadId
      ? await generatePresignedUrl(personalDetails.profilePictureUploadId)
      : null;

    const coverImgUrl = personalDetails.bgPictureUploadId
      ? await generatePresignedUrl(personalDetails.bgPictureUploadId)
      : null;

    // Fetch the number of connections
    const connectionRepository = AppDataSource.getRepository(Connection);
    const connectionsCount = await connectionRepository.count({
      where: [
        { requesterId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' },
      ],
    });

    const postRepository = AppDataSource.getRepository(UserPost);
    const userPostsCount = await postRepository.count({ where: { userId } });

    const likeRepository = AppDataSource.getRepository(Like);
    const userLikesCount = await likeRepository.count({ where: { userId } });

    const connectionsStatus = await connectionRepository.find({
      where: [
        { requesterId: userId, receiverId: profileId },
        { receiverId: userId, requesterId: profileId },
      ],
    });

    if (!connectionsStatus || connectionsStatus.length === 0) {
      connectionsStatus === null;
    }

    // Return the user's profile data
    return res.status(200).json({
      message: 'User profile fetched successfully.',
      data: {
        personalDetails,
        profileImgUrl,
        coverImgUrl,
        connectionsCount,
        postsCount: userPostsCount,
        likeCount: userLikesCount,
        connectionsStatus: connectionsStatus.length > 0 ? connectionsStatus[0].status : '',
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
  getMyProfileVisits: async (req: Request, res: Response) => {
    try {
      const { userId, page = 1, limit = 10 } = req.body;
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
        .offset((page - 1) * limit)
        .limit(limit)
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

          const visitedAt = visit.updatedAt ? formatTimestamp(visit.updatedAt) : formatTimestamp(visit.createdAt); // format timestamp not work
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
  getProfilesIVisited: async (req: Request, res: Response) => {
    try {
      const { userId, page = 1, limit = 10 } = req.body;

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
export const searchUserProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, searchQuery } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);

    // Search for users matching the query
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

    const connectionRepository = AppDataSource.getRepository(Connection);
    const searchResult = await Promise.all(
      searchResults
        .filter((result) => result.id !== userId)
        .map(async (result) => {
          // Fetch mutual connection count
          const mutualConnectionCount = await connectionRepository.count({
            where: [
              { requesterId: userId, receiverId: result.id, status: 'accepted' },
              { requesterId: result.id, receiverId: userId, status: 'accepted' },
            ],
          });

          // Get profile image URL
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
          };
        })
    );

    return res.status(200).json({
      message: 'Search results fetched successfully.',
      data: searchResult,
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