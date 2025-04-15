import { Connection } from '@/api/entity/connection/Connections';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { BlockedPost } from '@/api/entity/posts/BlockedPost';
import { Like } from '@/api/entity/posts/Like';
import { UserPost } from '@/api/entity/UserPost';
import { AppDataSource } from '@/server';
import { Between, In, Not } from 'typeorm';
import { generatePresignedUrl } from '../s3/awsControllers';
import { formatTimestamp } from './UserPost';
import { Request, Response } from 'express';
import { Comment } from '@/api/entity/posts/Comment';
import { BlockedUser } from '@/api/entity/posts/BlockedUser';
import { PollEntry } from '@/api/entity/posts/PollEntry';

// interface GetAllPostRequest extends Request {
//   body: {
//     userId: string;
//     page?: number;
//     limit?: number;
//   };
// }

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Get all posts for public view
export const getAllPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 100, isDiscussion = false } = req.query;
    const userId = req.userId;

    // const cacheKey = `posts:${userId}:${page}:${limit}:${isDiscussion}`;
    // const cachedData = await client.get(cacheKey);
    // if (cachedData) {
    //   console.log("*********************************************************CACHE***HIT**************************************************");
    //   return res.status(200).json(JSON.parse(cachedData));
    // }

    let discuss = false;
    if (isDiscussion === 'true') discuss = true;

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const blockPostRepo = AppDataSource.getRepository(BlockedPost);
    const blockUserRepo = AppDataSource.getRepository(BlockedUser);

    // const activeUsers = await userRepository.find({
    //   where: { active: 1 },
    //   select: ['id']
    // });
    // const activeUserIds = activeUsers.map(user => user.id);

    // // Fetch active connections
    // const connections = await connectionRepository.find({
    //   where: [
    //     { receiverId: userId, requesterId: In(activeUserIds) },
    //     { receiverId: In(activeUserIds), requesterId: userId }
    //   ]
    // });

    // const connectedUserIds = connections.map(conn =>
    //   conn.requesterId === userId ? conn.receiverId : conn.requesterId
    // );

    // // Fetch public posts first (no pagination yet)
    // const publicPosts = await userPostRepository.find({
    //   where: {
    //     userId: In(activeUserIds),
    //     isDiscussion: discuss,
    //     isHidden: false
    //   },
    //   order: { updatedAt: 'DESC', createdAt: 'DESC' }
    // });

    // // Extract post IDs for engagement filtering
    // const publicPostIds = publicPosts.map(post => post.id);
    // const activeConnectedUserIds = connectedUserIds.filter(id => activeUserIds.includes(id));

    // // Fetch likes and comments from active connections
    // const [connectionLikes, connectionComments] = await Promise.all([
    //   likeRepository.find({ where: { userId: In(activeConnectedUserIds), postId: In(publicPostIds) } }),
    //   commentRepository.find({ where: { userId: In(activeConnectedUserIds), postId: In(publicPostIds) } })
    // ]);

    // // Filter public posts that have engagement from active connections
    // const engagedPublicPostIds = new Set(
    //   [...connectionLikes, ...connectionComments].map(item => item.postId)
    // );

    // // Fetch priority posts (User + Connections' Posts)
    // const connectedPosts = await userPostRepository.find({
    //   where: {
    //     userId: In([...connectedUserIds, userId].filter(id => activeUserIds.includes(id!))),
    //     isDiscussion: discuss,
    //     isHidden: false
    //   },
    //   order: { updatedAt: 'DESC', createdAt: 'DESC' }
    // });

    // // Combine all post IDs and remove duplicates
    // const allPostIds = new Set([
    //   ...connectedPosts.map(post => post.id),
    //   ...publicPosts.filter(post => engagedPublicPostIds.has(post.id)).map(post => post.id)
    // ]);

    // const offest = (Number(page) - 1) * Number(limit);
    // // Fetch final post objects
    // let [ allPosts, countAllPost ] = await userPostRepository.findAndCount({
    //   where: { id: In([...allPostIds]) },
    //   order: { updatedAt: 'DESC', createdAt: 'DESC' },
    //   take: Number(limit),
    //   skip: offest
    // });

    // Fetch blocked posts and users
    const blockedPostIds = (await blockPostRepo.find({ where: { blockedBy: userId } })).map((bp) => bp.blockedPost);
    const blockedUserIds = (await blockUserRepo.find({ where: { blockedBy: userId } })).map((bu) => bu.blockedUser);

    // Fetch user details
    const currentUser = await userRepository.findOne({ where: { id: userId, active: 1 } });
    if (!currentUser) return res.status(400).json({ message: 'User not found.' });

    // const connections = await connectionRepository.find({
    //   where: [
    //     { requesterId: userId, status: 'accepted' },
    //     { receiverId: userId, status: 'accepted' },
    //   ],
    // });

    const connections = await connectionRepository
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.requester', 'requester')
      .leftJoinAndSelect('connection.receiver', 'receiver')
      .where(
        '(connection.requesterId = :userId OR connection.receiverId = :userId) AND ' +
          'connection.status = :status AND requester.active = 1 AND receiver.active = 1',
        { userId, status: 'accepted' }
      )
      .getMany();

    const connectedUserIds = connections.map((conn) =>
      conn.requesterId === userId ? conn.receiverId : conn.requesterId
    );

    // Fetch priority posts (User + Connections' Posts)
    const connectedPosts = await userPostRepository.find({
      where: { userId: In([...connectedUserIds, userId]), isDiscussion: discuss, isHidden: false },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    // // Fetch public posts
    // const publicPosts = await userPostRepository.find({
    //   where: { userId: Not(In([...connectedUserIds, userId])), isDiscussion: discuss, isHidden: false },
    //   order: { updatedAt: 'DESC', createdAt: 'DESC' },
    // });

    const publicPosts = await userPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.userIdRef', 'user')
      .where('post.userId NOT IN (:...excludedIds)', { excludedIds: [...connectedUserIds, userId] })
      .andWhere('post.isDiscussion = :isDiscussion', { isDiscussion: discuss })
      .andWhere('post.isHidden = false')
      .andWhere('user.active = 1')
      .orderBy('post.updatedAt', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .getMany();

    // // Identify posts that connections engaged with (liked or commented)
    const publicPostIds = publicPosts.map((post) => post.id);
    // console.log(publicPostIds.includes('aaf8a225140aacf7aa3969a425496fef'));
    const [connectionLikes, connectionComments] = await Promise.all([
      likeRepository.find({ where: { userId: In(connectedUserIds), postId: In(publicPostIds) } }),
      commentRepository.find({ where: { userId: In(connectedUserIds), postId: In(publicPostIds) } }),
    ]);

    const engagedPublicPosts = publicPosts.filter(
      (post) =>
        connectionLikes.some((like) => like.postId === post.id) ||
        connectionComments.some((comment) => comment.postId === post.id)
    );

    // Fetch all user posts
    // const userPost = await userPostRepository.find({ where: { userId: In([userId]), isDiscussion: discuss } });

    // Remaining public posts (not engaged by connections)
    const remainingPublicPosts = publicPosts.filter((post) => !engagedPublicPosts.includes(post));

    // Merge all prioritized posts
    let allPosts = [...connectedPosts, ...engagedPublicPosts, ...remainingPublicPosts];

    // Filter out blocked posts and users
    allPosts = allPosts.filter((post) => !blockedPostIds.includes(post.id) && !blockedUserIds.includes(post.userId));
    allPosts = allPosts
      .filter((post, index, self) => self.findIndex((p) => p.id === post.id) === index)
      .filter((post) => !blockedPostIds.includes(post.id) && !blockedUserIds.includes(post.userId)); // Remove blocked posts

    // // Sort posts by date (latest first)
    allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedPosts = allPosts.slice(startIndex, Number(startIndex) + Number(limit));
    const totalPosts = allPosts.length;

    // console.log(startIndex, page, limit);

    // const paginatedPosts = allPosts;

    if (!paginatedPosts.length) {
      return res.status(200).json({
        status: 'success',
        message: 'No posts found.',
        data: { posts: [], page, limit },
      });
    }

    // Fetch related comments, likes, and users
    const postIds = paginatedPosts.map((post) => post.id);

    // const [comments, likes] = await Promise.all([
    //   commentRepository.find({ where: { postId: In(postIds) } }),
    //   likeRepository.find({ where: { postId: In(postIds), status: true } }),
    // ]);

    const comments = await commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.userRef', 'userRef')
      .where('comment.postId IN (:...postIds)', { postIds })
      .andWhere('userRef.active = :active', { active: 1 })
      .getMany();

    const likes = await likeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.userIdRef', 'userIdRef')
      .where('like.postId IN (:...postIds)', { postIds })
      .andWhere('like.status = :status', { status: true })
      .andWhere('userIdRef.active = :active', { active: 1 })
      .getMany();

    const likedByConnections = connectionLikes.reduce(
      (acc, like) => {
        if (!acc[like.postId]) acc[like.postId] = [];
        acc[like.postId].push(like.userId);
        return acc;
      },
      {} as Record<string, string[]>
    );

    const commentedByConnections = connectionComments.reduce(
      (acc, comment) => {
        if (!acc[comment.postId]) acc[comment.postId] = [];
        acc[comment.postId].push(comment.userId);
        return acc;
      },
      {} as Record<string, string[]>
    );

    const formattedPosts = await Promise.all(
      paginatedPosts.map(async (post) => {
        const documentsUrls: { url: string; type: string }[] = [];

        await Promise.all(
          (Array.isArray(post.mediaKeys) ? post.mediaKeys : []).map(async (media) => {
            const dUrl = await generatePresignedUrl(media.key);
            documentsUrls.push({ url: dUrl, type: media.type });
          })
        );

        const likesByReactionId = await likeRepository
          .createQueryBuilder('like')
          .select('like.reactionId', 'reactionId')
          .addSelect('COUNT(like.id)', 'count')
          .where('like.postId = :postId', { postId: post.id })
          .groupBy('like.reactionId')
          .orderBy('count', 'DESC')
          .limit(3)
          .getRawMany();

        const likeCount = likes.filter((like) => like.postId === post.id).length;
        const commentCount = comments.filter((comment) => comment.postId === post.id).length;
        const like = await likeRepository.findOne({ where: { userId, postId: post.id } });
        const user = await userRepository.findOne({ where: { id: post.userId } });

        // Remove duplicate user interactions
        const uniqueLikedByConnections = Array.from(new Set(likedByConnections[post.id] || []));
        const uniqueCommentedByConnections = Array.from(new Set(commentedByConnections[post.id] || []));

        // Filter out users who liked the post from the commented list
        const finalCommentedByConnections = uniqueCommentedByConnections.filter(
          (userId) => !uniqueLikedByConnections.includes(userId)
        );

        // // Fetch user details for liked and commented connections
        const likedUsers = await userRepository.findByIds(uniqueLikedByConnections);
        const commentedUsers = await userRepository.findByIds(finalCommentedByConnections);

        const likedByConnectionsWithDetails = likedUsers.map((user) => ({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        }));

        const commentedByConnectionsWithDetails = commentedUsers.map((user) => ({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        }));

        let originalPUser;
        if (post?.repostedFrom) {
          const repostedPost = await userPostRepository.findOne({ where: { id: post.repostedFrom } });
          originalPUser = await userRepository.findOne({ where: { id: repostedPost?.userId } });
        }

        // poll
        const pollEntryRepo = AppDataSource.getRepository(PollEntry);
        const pollEntry = await pollEntryRepo.findOne({ where: { postId: post.id, userId } });

        return {
          post: {
            Id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            originalPostedAt: post.originalPostedAt,
            mediaUrls: documentsUrls,
            reactionCount: likeCount,
            topReactions: likesByReactionId,
            reactionStatus: like ? like.status : false,
            reactionId: like?.reactionId,
            commentCount,
            repostedFrom: post.repostedFrom,
            repostText: post.repostText,
            repostCount: post.repostCount,
            createdAt: post.createdAt,
            isDiscussion: post.isDiscussion,
            discussionTopic: post.discussionTopic,
            discussionContent: post.discussionContent,
            isPoll: post.isPoll,
            pollStatus: pollEntry?.status,
            pollOption: pollEntry?.selectedOption,
            question: post.question,
            postOptions: post.pollOptions,
            originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : '',
            likedByConnections: likedByConnectionsWithDetails,
            commentedByConnections: commentedByConnectionsWithDetails,
          },
          userDetails: {
            id: user?.id,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            avatar: user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
            timestamp: formatTimestamp(post.updatedAt || post.createdAt),
            userRole: user?.userRole,
            connection: connectedUserIds.includes(post.userId),
            badgeName: user?.badgeName,
            bio: user?.bio,
          },
          originalPostUser: {
            id: originalPUser?.id,
            firstName: originalPUser?.firstName || '',
            lastName: originalPUser?.lastName || '',
            avatar: originalPUser?.profilePictureUploadId
              ? await generatePresignedUrl(originalPUser.profilePictureUploadId)
              : null,
            userRole: originalPUser?.userRole,
            badgeName: originalPUser?.badgeName,
            bio: originalPUser?.bio,
          },
        };
      })
    );

    // Cache the formatted posts data in Redis
    const responseData = {
      status: 'success',
      message: 'Posts retrieved successfully.',
      data: { posts: formattedPosts, page, limit, totalPosts },
    };

    // await client.set(cacheKey, JSON.stringify(responseData), 'EX', 60 * 5);

    return res.status(200).json(responseData);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getAllPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
//   try {
//     const { page = 1, limit = 100, isDiscussion = false } = req.query;
//     const userId = req.userId;

//     let discuss = false;
//     if (isDiscussion === 'true') discuss = true;

//     // Initialize repositories
//     const userRepository = AppDataSource.getRepository(PersonalDetails);
//     const userPostRepository = AppDataSource.getRepository(UserPost);
//     const commentRepository = AppDataSource.getRepository(Comment);
//     const likeRepository = AppDataSource.getRepository(Like);
//     const connectionRepository = AppDataSource.getRepository(Connection);
//     const blockPostRepo = AppDataSource.getRepository(BlockedPost);
//     const blockUserRepo = AppDataSource.getRepository(BlockedUser);
//     const pollEntryRepo = AppDataSource.getRepository(PollEntry);

//     // Get all active users
//     const activeUsers = await userRepository.find({
//       where: { active: 1 },
//       select: ['id']
//     });
//     const activeUserIds = activeUsers.map(user => user.id);

//     // Verify current user exists and is active
//     const currentUser = await userRepository.findOne({
//       where: { id: userId, active: 1 }
//     });
//     if (!currentUser) {
//       return res.status(400).json({ message: 'User not found or inactive.' });
//     }

//     // Get user's accepted connections (both initiated and received)
//     const connections = await connectionRepository.find({
//       where: [
//         { receiverId: userId, status: 'accepted' },
//         { requesterId: userId, status: 'accepted' }
//       ]
//     });

//     // Filter to only include active users in connections
//     const connectedUserIds = connections.map(conn =>
//       conn.requesterId === userId ? conn.receiverId : conn.requesterId
//     ).filter(id => activeUserIds.includes(id));

//     // Get blocked posts and users
//     const [blockedPosts, blockedUsers] = await Promise.all([
//       blockPostRepo.find({ where: { blockedBy: userId } }),
//       blockUserRepo.find({ where: { blockedBy: userId } })
//     ]);
//     const blockedPostIds = blockedPosts.map(bp => bp.blockedPost);
//     const blockedUserIds = blockedUsers.map(bu => bu.blockedUser);

//     // Fetch priority posts (User + Connections' Posts) from active users
//     const connectedPosts = await userPostRepository.find({
//       where: {
//         userId: In([...connectedUserIds.filter(id => activeUserIds.includes(id)), userId]),
//         isDiscussion: discuss,
//         isHidden: false
//       },
//       order: { updatedAt: 'DESC', createdAt: 'DESC' },
//     });

//     // Fetch public posts from active users (excluding connected users)
//     const publicPosts = await userPostRepository.find({
//       where: {
//         userId: Not(In([...connectedUserIds.filter(id => activeUserIds.includes(id)), userId])),
//         isDiscussion: discuss,
//         isHidden: false
//       },
//       order: { updatedAt: 'DESC', createdAt: 'DESC' },
//     });

//     // Identify posts that connections engaged with (liked or commented)
//     const publicPostIds = publicPosts.map(post => post.id);
//     const [connectionLikes, connectionComments] = await Promise.all([
//       likeRepository.find({
//         where: {
//           userId: In(connectedUserIds),
//           postId: In(publicPostIds),
//           status: true
//         }
//       }),
//       commentRepository.find({
//         where: {
//           userId: In(connectedUserIds),
//           postId: In(publicPostIds)
//         }
//       }),
//     ]);

//     // Posts engaged by connections
//     const engagedPublicPosts = publicPosts.filter(post =>
//       connectionLikes.some(like => like.postId === post.id) ||
//       connectionComments.some(comment => comment.postId === post.id)
//     );

//     // Remaining public posts (not engaged by connections)
//     const remainingPublicPosts = publicPosts.filter(post =>
//       !engagedPublicPosts.includes(post)
//     );

//     // Merge all posts and filter duplicates, blocked content, and inactive users
//     let allPosts = [...connectedPosts, ...engagedPublicPosts, ...remainingPublicPosts]
//       .filter((post, index, self) =>
//         self.findIndex(p => p.id === post.id) === index
//       )
//       .filter(post =>
//         !blockedPostIds.includes(post.id) &&
//         !blockedUserIds.includes(post.userId) &&
//         activeUserIds.includes(post.userId)
//       );

//     // Sort posts by date (latest first)
//     allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

//     // Pagination
//     const startIndex = (Number(page) - 1) * Number(limit);
//     const paginatedPosts = allPosts.slice(startIndex, startIndex + Number(limit));
//     const totalPosts = allPosts.length;

//     if (!paginatedPosts.length) {
//       return res.status(200).json({
//         status: 'success',
//         message: 'No posts found.',
//         data: { posts: [], page, limit, totalPosts },
//       });
//     }

//     // Get all necessary related data
//     const postIds = paginatedPosts.map(post => post.id);
//     const [comments, likes, allPollEntries] = await Promise.all([
//       commentRepository.find({ where: { postId: In(postIds), userId: In(activeUserIds) } }),
//       likeRepository.find({ where: { postId: In(postIds), userId: In(activeUserIds), status: true } }),
//       pollEntryRepo.find({ where: { userId, postId: In(postIds) } })
//     ]);

//     // Prepare connection engagement data
//     const likedByConnections = connectionLikes.reduce((acc, like) => {
//       if (!acc[like.postId]) acc[like.postId] = [];
//       acc[like.postId].push(like.userId);
//       return acc;
//     }, {} as Record<string, string[]>);

//     const commentedByConnections = connectionComments.reduce((acc, comment) => {
//       if (!acc[comment.postId]) acc[comment.postId] = [];
//       acc[comment.postId].push(comment.userId);
//       return acc;
//     }, {} as Record<string, string[]>);

//     // Format posts with all necessary information
//     const formattedPosts = await Promise.all(paginatedPosts.map(async post => {
//       // Generate presigned URLs for media
//       const documentsUrls = await Promise.all(
//         (Array.isArray(post.mediaKeys) ? post.mediaKeys.map(async (media) => ({
//           url: await generatePresignedUrl(media.key),
//           type: media.type
//         })) : []
//         ));

//       // Get top reactions for the post
//       const likesByReactionId = await likeRepository
//         .createQueryBuilder("like")
//         .select("like.reactionId", "reactionId")
//         .addSelect("COUNT(like.id)", "count")
//         .where("like.postId = :postId", { postId: post.id })
//         .andWhere("like.status = :status", { status: true })
//         .groupBy("like.reactionId")
//         .orderBy("count", "DESC")
//         .limit(3)
//         .getRawMany();

//       // Counts and user engagement
//       const likeCount = likes.filter(like => like.postId === post.id).length;
//       const commentCount = comments.filter(comment => comment.postId === post.id).length;
//       const userLike = likes.find(like => like.postId === post.id && like.userId === userId);
//       const userPollEntry = allPollEntries.find(entry => entry.postId === post.id);

//       // Get post author details
//       const user = await userRepository.findOne({
//         where: { id: post.userId },
//         select: ['id', 'firstName', 'lastName', 'profilePictureUploadId', 'userRole', 'badgeName', 'bio']
//       });

//       // Get original post user details if this is a repost
//       let originalPUser = null;
//       if (post.repostedFrom) {
//         const repostedPost = await userPostRepository.findOne({
//           where: { id: post.repostedFrom },
//           select: ['userId']
//         });
//         if (repostedPost) {
//           originalPUser = await userRepository.findOne({
//             where: { id: repostedPost.userId },
//             select: ['id', 'firstName', 'lastName', 'profilePictureUploadId', 'userRole', 'badgeName', 'bio']
//           });
//         }
//       }

//       // Prepare connection engagement details
//       // const uniqueLikedByConnections = Array.from(new Set(likedByConnections[post.id] || []));
//       // const uniqueCommentedByConnections = Array.from(new Set(commentedByConnections[post.id] || []))
//       //   .filter(id => !uniqueLikedByConnections.includes(id));

//       const uniqueLikedByConnections = Array.from(new Set(likedByConnections[post.id] || []))
//         .filter(id => activeUserIds.includes(id));

//       const uniqueCommentedByConnections = Array.from(new Set(commentedByConnections[post.id] || []))
//         .filter(id => !uniqueLikedByConnections.includes(id) && activeUserIds.includes(id));

//       const [likedUsers, commentedUsers] = await Promise.all([
//         userRepository.findByIds(uniqueLikedByConnections),
//         userRepository.findByIds(uniqueCommentedByConnections)
//       ]);

//       return {
//         post: {
//           Id: post.id,
//           userId: post.userId,
//           title: post.title,
//           content: post.content,
//           hashtags: post.hashtags,
//           originalPostedAt: post.originalPostedAt,
//           mediaUrls: documentsUrls,
//           reactionCount: likeCount,
//           topReactions: likesByReactionId,
//           reactionStatus: !!userLike,
//           reactionId: userLike?.reactionId,
//           commentCount,
//           repostedFrom: post.repostedFrom,
//           repostText: post.repostText,
//           repostCount: post.repostCount,
//           createdAt: post.createdAt,
//           isDiscussion: post.isDiscussion,
//           discussionTopic: post.discussionTopic,
//           discussionContent: post.discussionContent,
//           isPoll: post.isPoll,
//           pollStatus: userPollEntry?.status,
//           pollOption: userPollEntry?.selectedOption,
//           question: post.question,
//           postOptions: post.pollOptions,
//           originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : '',
//           likedByConnections: likedUsers.map(user => ({
//             id: user.id,
//             firstName: user.firstName || '',
//             lastName: user.lastName || '',
//           })),
//           commentedByConnections: commentedUsers.map(user => ({
//             id: user.id,
//             firstName: user.firstName || '',
//             lastName: user.lastName || '',
//           })),
//         },
//         userDetails: {
//           id: user?.id,
//           firstName: user?.firstName || '',
//           lastName: user?.lastName || '',
//           avatar: user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
//           timestamp: formatTimestamp(post.updatedAt || post.createdAt),
//           userRole: user?.userRole,
//           connection: connectedUserIds.includes(post.userId),
//           badgeName: user?.badgeName,
//           bio: user?.bio
//         },
//         originalPostUser: originalPUser ? {
//           id: originalPUser.id,
//           firstName: originalPUser.firstName || '',
//           lastName: originalPUser.lastName || '',
//           avatar: originalPUser.profilePictureUploadId ? await generatePresignedUrl(originalPUser.profilePictureUploadId) : null,
//           userRole: originalPUser.userRole,
//           badgeName: originalPUser.badgeName,
//           bio: originalPUser.bio
//         } : null
//       };
//     }));

//     return res.status(200).json({
//       status: 'success',
//       message: 'Posts retrieved successfully.',
//       data: {
//         posts: formattedPosts,
//         page: Number(page),
//         limit: Number(limit),
//         totalPosts
//       },
//     });

//   } catch (error: any) {
//     console.error('Error in getAllPost:', error);
//     return res.status(500).json({
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };
