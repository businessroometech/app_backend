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
    const { page = 1, limit = 5 , isDiscussion = false} = req.query;

    
    const userId = req.userId;
    
    let discuss = false;
    if(isDiscussion === 'true') discuss = true;

    // Repositories
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const blockPostRepo = AppDataSource.getRepository(BlockedPost);
    const blockUserRepo = AppDataSource.getRepository(BlockedUser);

    // Fetch blocked posts and users
    const blockedPostIds = (await blockPostRepo.find({ where: { blockedBy: userId } })).map(bp => bp.blockedPost);
    const blockedUserIds = (await blockUserRepo.find({ where: { blockedBy: userId } })).map(bu => bu.blockedUser);

    // Fetch user details
    const currentUser = await userRepository.findOne({ where: { id: userId } });
    if (!currentUser) return res.status(404).json({ message: 'User not found.' });

    // Fetch connections
    const connections = await connectionRepository.find({
      where: [
        { receiverId: userId, status: 'accepted' },
        { requesterId: userId, status: 'accepted' },
      ],
    });
    const connectedUserIds = connections.map(conn => conn.requesterId === userId ? conn.receiverId : conn.requesterId);

    // Fetch priority posts (User + Connections' Posts)
    const connectedPosts = await userPostRepository.find({
      where: { userId: In([...connectedUserIds, userId]), isDiscussion: discuss, isHidden: false },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    // Fetch public posts
    const publicPosts = await userPostRepository.find({
      where: { userId: Not(In([...connectedUserIds, userId])), isDiscussion: discuss, isHidden: false },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    // Identify posts that connections engaged with (liked or commented)
    const publicPostIds = publicPosts.map(post => post.id);
    const [connectionLikes, connectionComments] = await Promise.all([
      likeRepository.find({ where: { userId: In(connectedUserIds), postId: In(publicPostIds) } }),
      commentRepository.find({ where: { userId: In(connectedUserIds), postId: In(publicPostIds) } }),
    ]);

    const engagedPublicPosts = publicPosts.filter(post =>
      connectionLikes.some(like => like.postId === post.id) ||
      connectionComments.some(comment => comment.postId === post.id)
    );

    // Fetch all user posts
    const userPost = await userPostRepository.find({ where: { userId: In([userId]), isDiscussion: discuss } });

    // Remaining public posts (not engaged by connections)
    const remainingPublicPosts = publicPosts.filter(post => !engagedPublicPosts.includes(post));

    // Merge all prioritized posts
    let allPosts = [...userPost, ...connectedPosts, ...engagedPublicPosts, ...remainingPublicPosts];

    // Filter out blocked posts and users
    allPosts = allPosts.filter(post => !blockedPostIds.includes(post.id) && !blockedUserIds.includes(post.userId));
    allPosts = allPosts
      .filter((post, index, self) =>
        self.findIndex(p => p.id === post.id) === index
      )
      .filter(post => !blockedPostIds.includes(post.id) && !blockedUserIds.includes(post.userId)); // Remove blocked posts

    // Sort posts by date (latest first)
    allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedPosts = allPosts.slice(startIndex, startIndex + Number(limit));
    const totalPosts = allPosts.length;

    if (!paginatedPosts.length) {
      return res.status(200).json({
        status: 'success',
        message: 'No posts found.',
        data: { posts: [], page, limit, totalPosts },
      });
    }

    // Fetch related comments, likes, and users
    const postIds = paginatedPosts.map(post => post.id);
    const [comments, likes] = await Promise.all([
      commentRepository.find({ where: { postId: In(postIds) } }),
      likeRepository.find({ where: { postId: In(postIds), status: true } }),
    ]);

    const likedByConnections = connectionLikes.reduce((acc, like) => {
      if (!acc[like.postId]) acc[like.postId] = [];
      acc[like.postId].push(like.userId);
      return acc;
    }, {} as Record<string, string[]>);

    const commentedByConnections = connectionComments.reduce((acc, comment) => {
      if (!acc[comment.postId]) acc[comment.postId] = [];
      acc[comment.postId].push(comment.userId);
      return acc;
    }, {} as Record<string, string[]>);

    // Generate media URLs
    // const mediaKeysWithUrls = await Promise.all(paginatedPosts.map(async post => ({
    //   postId: post.id,
    //   mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map(generatePresignedUrl)) : [],
    // })));

    // Format posts
    const formattedPosts = await Promise.all(paginatedPosts.map(async post => {
      const documentsUrls: { url: string, type: string }[] = [];
      post.mediaKeys?.map(async (media) => {
        const dUrl = await generatePresignedUrl(media.key);
        documentsUrls.push({ url: dUrl, type: media.type });
      });
      const likeCount = likes.filter(like => like.postId === post.id).length;
      const commentCount = comments.filter(comment => comment.postId === post.id).length;
      const like = await likeRepository.findOne({ where: { userId, postId: post.id } });
      const user = await userRepository.findOne({ where: { id: post.userId } });

      // Remove duplicate user interactions
      const uniqueLikedByConnections = Array.from(new Set(likedByConnections[post.id] || []));
      const uniqueCommentedByConnections = Array.from(new Set(commentedByConnections[post.id] || []));

      // Filter out users who liked the post from the commented list
      const finalCommentedByConnections = uniqueCommentedByConnections.filter(userId => !uniqueLikedByConnections.includes(userId));

      return {
        post: {
          Id: post.id,
          userId: post.userId,
          title: post.title,
          content: post.content,
          hashtags: post.hashtags,
          // mediaKeys: post.mediaKeys,
          repostPostId: post.isRepost,
          originalPostedAt: post.originalPostedAt,
          mediaUrls: documentsUrls,
          reactionCount: likeCount,
          reactionStatus: like?.status,
          reactionId: like?.reactionId,
          commentCount,
          repostedFrom: post.repostedFrom,
          repostText: post.repostText,
          createdAt: post.createdAt,
          isDiscussion: post.isDiscussion,
          discussionTopic: post.discussionTopic,
          discussionContent: post.discussionContent,
          originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : '',
          likedByConnections: uniqueLikedByConnections,
          commentedByConnections: finalCommentedByConnections,

        },
        userDetails: {
          id: user?.id,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          avatar: user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
          timestamp: formatTimestamp(post.updatedAt || post.createdAt),
          userRole: user?.userRole,
          connection: connectedUserIds.includes(post.userId),
        },
      };
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Posts retrieved successfully.',
      data: { posts: formattedPosts, page, limit, totalPosts },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
