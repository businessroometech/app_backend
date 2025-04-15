import { Request, Response } from 'express';

import { Connection } from '@/api/entity/connection/Connections';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { And, Equal, ILike, In } from 'typeorm';
import { UserPost } from '@/api/entity/UserPost';
import { AppDataSource } from '@/server';

import { generatePresignedUrl, uploadBufferDocumentToS3 } from '../s3/awsControllers';
import { ProfileVisit } from '@/api/entity/notifications/ProfileVisit';
import { sendNotification } from '../notifications/SocketNotificationController';
import { Like } from '@/api/entity/posts/Like';
import { BlockedUser } from '@/api/entity/posts/BlockedUser';
import multer from 'multer';
import { Notify } from '@/api/entity/notify/Notify';
import { Message } from '@/api/entity/chat/Message';
import { MessageHistory } from '@/api/entity/chat/MessageHistory';
import { getSocketInstance } from '@/socket';
import sharp from 'sharp';
import { Ristriction } from '@/api/entity/ristrictions/Ristriction';
import { analyzeTextContent } from '../helpers/ExplicitText';

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

export const uploadProfileAndCover = multer({
  storage: multer.memoryStorage(),
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "coverPhoto", maxCount: 1 }
]);

async function compressImage(imageBuffer: Buffer, userId: string, mimetype: string): Promise<{ fileKey: string; type: string }> {
  try {
    const compressedBuffer = await sharp(imageBuffer)
      .resize({ width: 1200 }) // Reduce resolution
      .jpeg({ quality: 70 }) // Compress JPEG images
      .png({ compressionLevel: 8 }) // Compress PNG images
      .webp({ quality: 70 }) // Convert to WebP if needed
      .toBuffer();

    const uploadUrl: any = await uploadBufferDocumentToS3(compressedBuffer, userId, mimetype);
    return uploadUrl;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
}

export const UpdateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      bio,
      city,
      state,
      country,
      gender,
      userRole,
      linkedIn,
      badgeName,
      experience,
    } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ status: "error", message: "User ID is missing or invalid." });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const personalDetails = await userRepository.findOneBy({ id: userId });

    if (!personalDetails) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    //------------------------ explict text -----------------------------------

    const bioCheck = await analyzeTextContent(bio);

    if (!bioCheck?.allowed) {
      res.status(400).json({ status: "fail", message: bioCheck?.reason });
      return;
    }

    // ---------------------------------------------------------------------------


    if (bio && bio?.length > 60) {
      return res.status(400).json({ status: "error", message: "Bio must be under 60 characters." });
    }

    if (firstName !== undefined) personalDetails.firstName = firstName;
    if (lastName !== undefined) personalDetails.lastName = lastName;
    if (dob !== undefined) personalDetails.dob = dob;
    if (experience !== undefined) personalDetails.experience = experience;
    if (bio !== undefined) personalDetails.bio = bio;
    if (city !== undefined) personalDetails.city = city;
    if (state !== undefined) personalDetails.state = state;
    if (country !== undefined) personalDetails.country = country;
    if (gender !== undefined) personalDetails.gender = gender;
    if (userRole !== undefined) personalDetails.userRole = userRole;
    if (linkedIn !== undefined) personalDetails.linkedIn = linkedIn;
    if (badgeName !== undefined) personalDetails.badgeName = badgeName;

    if (req.files && Object.keys(req.files).length > 0) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      try {
        if (files.profilePhoto?.length) {
          console.log("Uploading profile photo:", files.profilePhoto[0].originalname);
          // const profilePhotoKey = await uploadBufferDocumentToS3(
          // files.profilePhoto[0].buffer,
          // userId,
          // files.profilePhoto[0].mimetype
          // );

          const profilePhotoKey = await compressImage(files.profilePhoto[0].buffer,
            userId,
            files.profilePhoto[0].mimetype);

          personalDetails.profilePictureUploadId = profilePhotoKey?.fileKey;
        }

        if (files.coverPhoto?.length) {
          console.log("Uploading cover photo:", files.coverPhoto[0].originalname);
          // const coverPhotoKey = await uploadBufferDocumentToS3(
          //   files.coverPhoto[0].buffer,
          //   userId,
          //   files.coverPhoto[0].mimetype
          // );
          const coverPhotoKey = await compressImage(files.coverPhoto[0].buffer,
            userId,
            files.coverPhoto[0].mimetype);
          personalDetails.bgPictureUploadId = coverPhotoKey?.fileKey;
        }
      } catch (uploadError) {
        console.error("Error uploading images to S3:", uploadError);
      }
    }

    // if (personalDetails.stage === 0) personalDetails.stage = 1;

    personalDetails.updatedBy = "system";
    await userRepository.save(personalDetails);

    return res.status(200).json({
      status: "success",
      message: "User profile updated successfully.",
      data: personalDetails,
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// get user profile
export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    let { profileId } = req.query;

    let isMyProfile = false;

    if (!profileId) {
      isMyProfile = true;
      profileId = userId;
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
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
    let personalDetails;
    if (!isMyProfile) {
      personalDetails = await personalDetailsRepository.findOne({
        where: { id: String(profileId) },
        select: ["id", "firstName", "lastName", "bio", "profilePictureUploadId", "bgPictureUploadId", "badgeName", "city", "country", "countryCode", "createdAt", "updatedAt", "dob", "gender", "isAdmin", "active", "userRole", "subRole"]
      });
    }
    else {
      personalDetails = await personalDetailsRepository.findOne({
        where: { id: String(profileId) },
        select: ["id", "firstName", "lastName", "bio", "mobileNumber", "emailAddress", "linkedIn", "profilePictureUploadId", "bgPictureUploadId", "badgeName", "city", "country", "countryCode", "createdAt", "updatedAt", "dob", "gender", "isAdmin", "active", "userRole", "subRole"]
      });
    }

    const ristrictionRepo = AppDataSource.getRepository(Ristriction);
    const ristrict = await ristrictionRepo.findOne({ where: { userId: personalDetails?.id } });

    if (!personalDetails) {
      return res.status(400).json({
        status: "error",
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
          status: "success",
          message: 'You have blocked this user.',
          data: { personalDetails, connectionsStatus: "Blocked", unblockOption: true, }
        });
      } else {
        return res.status(200).json({
          status: "success",
          message: 'You are blocked from viewing this profile.',
          data: { personalDetails, connectionsStatus: "Blocked", }
        });
      }
    }

    const NotifyRepo = AppDataSource.getRepository(Notify);
    const [notifcation, notifyCount] = await NotifyRepo.findAndCount({ where: { recieverId: userId, isRead: false } });

    const messageRepo = AppDataSource.getRepository(Message);
    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    const history = await messageHistoryRepo.find({
      where: [
        { senderId: userId },
        { receiverId: userId }
      ],
    });

    const unreadMessagesCount = (await Promise.all(
      (history || []).map(async (his) => {
        let myId = his.receiverId === userId ? his.receiverId : his.senderId;
        let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

        const count = await messageRepo.count({
          where: { receiverId: myId, senderId: otherId, isRead: false },
        });

        return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
      })
    )).filter((item) => item !== null);

    const io = getSocketInstance();
    io.to(userId).emit('initialize', {
      userId,
      welcomeMessage: 'Welcome to BusinessRoom!',
      unreadNotificationsCount: notifyCount ? notifyCount : 0,
      unreadMessagesCount: unreadMessagesCount ? unreadMessagesCount.length : 0,
    });

    return res.status(200).json({
      status: "success",
      message: 'User profile fetched successfully.',
      data: {
        personalDetails: { ...personalDetails, isBusinessProfileFilled: ristrict?.isBusinessProfileCompleted },
        profileImgUrl,
        coverImgUrl,
        connectionsCount,
        postsCount,
        likeCount,
        connectionsStatus: connectionsStatus ? connectionsStatus.status : null,
        requiterId: connectionsStatus ? connectionsStatus.requesterId : null,
        receiverId: connectionsStatus ? connectionsStatus.receiverId : null,
      },
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      status: "error",
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

// export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
//   try {
//     const userId = req.userId;
//     const { profileId = userId } = req.query;
//     const profileIdStr = String(profileId);

//     if (!userId) {
//       return res.status(400).json({
//         status: "error",
//         message: 'User ID is required.',
//       });
//     }

//     // Initialize repositories
//     const repos = {
//       personalDetails: AppDataSource.getRepository(PersonalDetails),
//       connection: AppDataSource.getRepository(Connection),
//       post: AppDataSource.getRepository(UserPost),
//       like: AppDataSource.getRepository(Like),
//       blockedUser: AppDataSource.getRepository(BlockedUser),
//       restriction: AppDataSource.getRepository(Ristriction),
//       notify: AppDataSource.getRepository(Notify),
//       message: AppDataSource.getRepository(Message),
//       messageHistory: AppDataSource.getRepository(MessageHistory)
//     };

//     // First get all active users
//     const activeUsers = await repos.personalDetails.find({
//       where: { active: 1 },
//       select: ['id']
//     });
//     const activeUserIds = activeUsers.map(user => user.id);

//     // Check if requested profile is active
//     if (!activeUserIds.includes(profileIdStr)) {
//       return res.status(404).json({
//         status: "error",
//         message: 'User profile not found or inactive.',
//       });
//     }

//     // Check blocking status (only between active users)
//     const [blockedEntry, personalDetails, restriction] = await Promise.all([
//       repos.blockedUser.findOne({
//         where: [
//           { blockedBy: userId, blockedUser: profileIdStr },
//           { blockedBy: profileIdStr, blockedUser: userId },
//         ],
//       }),
//       repos.personalDetails.findOne({
//         where: {
//           id: profileIdStr,
//           active: 1
//         }
//       }),
//       repos.restriction.findOne({ where: { userId: profileIdStr } })
//     ]);

//     if (!personalDetails) {
//       return res.status(404).json({
//         status: "error",
//         message: 'User profile not found.',
//       });
//     }

//     // Handle blocked users
//     if (blockedEntry) {
//       return res.status(200).json({
//         status: "success",
//         message: blockedEntry.blockedBy === userId ?
//           'You have blocked this user.' :
//           'You are blocked from viewing this profile.',
//         data: {
//           personalDetails,
//           connectionsStatus: "Blocked",
//           ...(blockedEntry.blockedBy === userId && { unblockOption: true })
//         }
//       });
//     }

//     // Generate image URLs in parallel
//     const [profileImgUrl, coverImgUrl] = await Promise.all([
//       personalDetails.profilePictureUploadId ?
//         generatePresignedUrl(personalDetails.profilePictureUploadId).catch(() => null) :
//         null,
//       personalDetails.bgPictureUploadId ?
//         generatePresignedUrl(personalDetails.bgPictureUploadId).catch(() => null) :
//         null
//     ]);

//     // Fetch counts in parallel (only from active users)
//     const [connectionsCount, postsCount, likeCount, connectionsStatus, notificationData] = await Promise.all([
//       repos.connection.count({
//         where: [
//           {
//             status: 'accepted',
//             requesterId: And(
//               Equal(profileIdStr),
//               In(activeUserIds)
//             ),
//             receiverId: In(activeUserIds)
//           },
//           {
//             status: 'accepted',
//             requesterId: In(activeUserIds),
//             receiverId: And(
//               Equal(profileIdStr),
//               In(activeUserIds)
//             ),
//           },
//         ],
//       }),
//       repos.post.count({
//         where: {
//           userId: And(
//             Equal(profileIdStr),
//             In(activeUserIds)
//           ),
//         }
//       }),
//       repos.like.count({
//         where: {
//           userId: And(
//             Equal(profileIdStr),
//             In(activeUserIds)
//           ),
//         }
//       }),
//       repos.connection.findOne({
//         where: [
//           {
//             requesterId: And(
//               Equal(userId),
//               In(activeUserIds)
//             ),
//             receiverId: And(
//               Equal(profileIdStr),
//               In(activeUserIds)
//             ),
//           },
//           {
//             requesterId: And(
//               Equal(profileIdStr),
//               In(activeUserIds)
//             ),
//             receiverId: And(
//               Equal(userId),
//               In(activeUserIds)
//             ),
//           },
//         ],
//       }),
//       repos.notify.findAndCount({
//         where: {
//           recieverId: And(
//             Equal(userId),
//             In(activeUserIds)
//           ),
//         }
//       })
//     ]);

//     // Get unread messages count (only between active users)
//     const history = await repos.messageHistory.find({
//       where: [
//         {
//           senderId: And(
//             Equal(userId),
//             In(activeUserIds)
//           ),
//         },
//         {
//           receiverId: And(
//             Equal(userId),
//             In(activeUserIds)
//           ),
//         }
//       ],
//     });

//     const unreadMessagesCount = (await Promise.all(
//       history.map(async (his) => {
//         const isReceiver = his.receiverId === userId;
//         const count = await repos.message.count({
//           where: {
//             isRead: false,
//             senderId: And(
//               Equal(isReceiver ? his.senderId : his.receiverId,),
//               In(activeUserIds)
//             ),
//             receiverId: And(
//               Equal(isReceiver ? his.receiverId : his.senderId),
//               In(activeUserIds)
//             ),
//           },
//         });
//         return count > 0 ? {
//           senderId: isReceiver ? his.senderId : his.receiverId,
//           unReadCount: count
//         } : null;
//       })
//     )).filter(Boolean);

//     // Emit socket event
//     const io = getSocketInstance();
//     io.to(userId).emit('initialize', {
//       userId,
//       welcomeMessage: 'Welcome to BusinessRoom!',
//       unreadNotificationsCount: notificationData[1] || 0,
//       unreadMessagesCount: unreadMessagesCount.length || 0,
//     });

//     return res.status(200).json({
//       status: "success",
//       message: 'User profile fetched successfully.',
//       data: {
//         personalDetails: {
//           ...personalDetails,
//           isBusinessProfileFilled: restriction?.isBusinessProfileCompleted
//         },
//         profileImgUrl,
//         coverImgUrl,
//         counts: {
//           connections: connectionsCount,
//           posts: postsCount,
//           likes: likeCount
//         },
//         connectionStatus: {
//           status: connectionsStatus?.status || null,
//           requesterId: connectionsStatus?.requesterId || null,
//           receiverId: connectionsStatus?.receiverId || null
//         }
//       },
//     });

//   } catch (error: any) {
//     console.error('Error fetching user profile:', error);
//     return res.status(500).json({
//       status: "error",
//       message: 'Internal Server Error',
//       error: error.message,
//     });
//   }
// };

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
    const searchQuery = req.query.search as string;
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({ message: 'Search query must be a valid string.' });
    }

    console.log('Search Query:', searchQuery);
    console.log('User ID:', userId);

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);

    // Fetch users matching the search query
    const searchResults = await personalDetailsRepository.find({
      where: [
        { firstName: ILike(`%${searchQuery}%`), active: 1 },
        { lastName: ILike(`%${searchQuery}%`), active: 1 },
      ],
    });

    console.log('Search Results Count:', searchResults.length);

    if (searchResults.length === 0) {
      return res.status(200).json({ message: 'No results found.' });
    }

    // Process the filtered results
    const filteredResults = await Promise.all(
      searchResults.map(async (result) => {
        if (!result.id) {
          console.error('Error: Result has no ID', result);
          return null;
        }

        // Fetch mutual connection count
        let mutualConnectionCount = 0;
        try {
          mutualConnectionCount = await connectionRepository.count({
            where: [
              { requesterId: userId, receiverId: result.id, status: 'accepted' },
              { requesterId: result.id, receiverId: userId, status: 'accepted' },
            ],
          });
        } catch (countError) {
          console.error('Error fetching mutual connection count:', countError);
        }

        // Generate profile image URL
        let profileImgUrl = null;
        if (result.profilePictureUploadId) {
          try {
            profileImgUrl = await generatePresignedUrl(result.profilePictureUploadId);
          } catch (presignedUrlError) {
            console.error('Error generating presigned URL:', presignedUrlError);
          }
        }

        return {
          id: result.id,
          firstName: result.firstName,
          lastName: result.lastName,
          emailAddress: result.emailAddress,
          userRole: result.userRole,
          profileImgUrl,
          mutualConnectionCount,
          badgeName: result.badgeName,
          bio: result.bio,
        };
      })
    );

    return res.status(200).json({
      message: 'Search results fetched successfully.',
      data: filteredResults.filter(Boolean), // Remove null values
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