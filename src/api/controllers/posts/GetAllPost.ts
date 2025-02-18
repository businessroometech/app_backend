import { Connection } from '@/api/entity/connection/Connections';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { BlockedPost } from '@/api/entity/posts/BlockedPost';
import { Like } from '@/api/entity/posts/Like';
import { UserPost } from '@/api/entity/UserPost';
import { AppDataSource } from '@/server';
import { Between, In, Not } from 'typeorm';
import { generatePresignedUrl } from '../s3/awsControllers';
import { formatTimestamp } from '../UserPost';
import { Request, Response } from 'express';
import { Comment } from '@/api/entity/posts/Comment';
import { BlockedUser } from '@/api/entity/posts/BlockedUser';

interface GetAllPostRequest extends Request {
  body: {
    userId: string;
    page?: number;
    limit?: number;
  };
}

// Get all posts for public view
export const getAllPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, page = 1, limit = 5 } = req.body;

    // Repositories
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const blockPostRepo = AppDataSource.getRepository(BlockedPost);
    const blockUserRepo = AppDataSource.getRepository(BlockedUser);

    // Fetch blocked posts and users
    const blockedPosts = await blockPostRepo.find({ where: { blockedBy: userId } });
    const blockedUsers = await blockUserRepo.find({ where: { blockedBy: userId } });

    const blockedPostIds = blockedPosts.map((bp) => bp.blockedPost);
    const blockedUserIds = blockedUsers.map((bu) => bu.blockedUser);

    // Fetch user details
    const currentUser = await userRepository.findOne({ where: { id: userId } });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch connections
    const connections = await connectionRepository.find({
      where: [
        { receiverId: userId, status: 'accepted' },
        { requesterId: userId, status: 'accepted' },
      ],
    });
    const connectedUserIds = connections.map((conn) =>
      conn.requesterId === userId ? conn.receiverId : conn.requesterId
    );

    // Fetch priority posts (Connections' Posts)
    const connectedPosts = await userPostRepository.find({
      where: { userId: In([...connectedUserIds, userId]) , isHidden: false },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    // Fetch public posts engaged by connections
    const publicPosts = await userPostRepository.find({
      where: { userId: Not(In([...connectedUserIds, userId])) , isHidden: false},
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    // Identify posts that connections engaged with (liked or commented)
    const publicPostIds = publicPosts.map((post) => post.id);
    const connectionLikes = await likeRepository.find({
      where: { userId: In(connectedUserIds), postId: In(publicPostIds) },
    });
    const connectionComments = await commentRepository.find({
      where: { userId: In(connectedUserIds), postId: In(publicPostIds) },
    });

    const engagedPublicPosts = publicPosts.filter(
      (post) =>
        connectionLikes.some((like) => like.postId === post.id) ||
        connectionComments.some((comment) => comment.postId === post.id)
    );

    // Fetch all other public posts
    const remainingPublicPosts = publicPosts.filter((post) => !engagedPublicPosts.includes(post));

    // Merge all prioritized posts
    let allPosts = [ ...engagedPublicPosts, ...connectedPosts, ...remainingPublicPosts];

    // Filter out blocked posts and posts by blocked users
    allPosts = allPosts.filter((post) => !blockedPostIds.includes(post.id) && !blockedUserIds.includes(post.userId));

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = allPosts.slice(startIndex, startIndex + limit);
    const totalPosts = allPosts.length;

    if (!paginatedPosts.length) {
      return res.status(200).json({
        status: 'success',
        message: 'No posts found.',
        data: { posts: [], page, limit, totalPosts },
      });
    }

    const postIds = paginatedPosts.map((post) => post.id);

    // Fetch related comments, likes, and reactions
    const comments = await commentRepository.find({ where: { postId: In(postIds) } });
    const likes = await likeRepository.find({ where: { postId: In(postIds) } });

    // Fetch users who engaged with posts
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

    // Generate media URLs for posts
    const mediaKeysWithUrls = await Promise.all(
      paginatedPosts.map(async (post) => ({
        postId: post.id,
        mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map(generatePresignedUrl)) : [],
      }))
    );

    // Format posts
    const formattedPosts = await Promise.all(
      paginatedPosts.map(async (post) => {
        const mediaUrls = mediaKeysWithUrls.find((media) => media.postId === post.id)?.mediaUrls || [];
        const likeCount = likes.filter((like) => like.postId === post.id).length;
        const commentCount = comments.filter((comment) => comment.postId === post.id).length;
        const like = await likeRepository.findOne({ where: { userId, postId: post.id } });
        const user = await userRepository.findOne({ where: { id: post.userId } });

        return {
          post: {
            Id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            mediaUrls,
            likeCount,
            commentCount,
            likeStatus: like ? like.status : false,
            isRepost: post.isRepost,
            repostedFrom: post.repostedFrom,
            repostText: post.repostText,
            createdAt: post.createdAt,
            originalPostedAt: post.originalPostedAt,
            originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : '',
            likedByConnections: Array.from(new Set(likedByConnections[post.id] || [])), 
            commentedByConnections: Array.from(new Set(commentedByConnections[post.id] || [])),
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
      })
    );

    return res.status(200).json({
      status: 'success',
      message: 'Posts retrieved successfully.',
      data: { posts: formattedPosts, page, limit, totalPosts },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
