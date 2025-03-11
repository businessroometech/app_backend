import multer from 'multer';
import { Request, Response } from 'express';
import { UserPost } from '../../entity/UserPost';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { Comment } from '../../entity/posts/Comment';
import { Like } from '../../entity/posts/Like';
import { generatePresignedUrl } from '../s3/awsControllers';
import { In, Not } from 'typeorm';
import { Reaction } from '../../entity/posts/Reaction';
import { Mention } from '../../entity/posts/Mention';
import { broadcastMessage, getSocketInstance } from '@/socket';
import { sendNotification } from '../notifications/SocketNotificationController';
import { BlockedPost } from '../../entity/posts/BlockedPost';
import { Connection } from '../../entity/connection/Connections';
import { uploadBufferDocumentToS3, getDocumentFromBucket } from "../s3/awsControllers";
import { PollEntry } from '@/api/entity/posts/PollEntry';

export const formatTimestamp = (createdAt: Date): string => {
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

export interface AuthenticatedRequest extends Request {
  userId?: string;
}


const storage = multer.memoryStorage();

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
// }).array("files");

export const CreateUserPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {

    const { title, content, hashtags, repostedFrom, repostText, isDiscussion, discussionTopic, discussionContent, isPoll, question, pollOptions } = req.body;
    const userId = req.userId;

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({ message: 'User ID is invalid or does not exist.' });
    }

    // Extract mentions from content
    // const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    // const mentions = [...content.matchAll(mentionPattern)].map((match) => match[1]);

    // const mentionedUsers = await userRepository.find({ where: { userName: In(mentions) } });
    // const validMentionedUserIds = mentionedUsers.map((u) => u.id);

    // if (mentions.length > 0 && validMentionedUserIds.length !== mentions.length) {
    //   return res.status(404).json({
    //     message: 'One or more mentioned users do not exist.',
    //     invalidMentions: mentions.filter((m) => !mentionedUsers.some((u) => u.userName === m)),
    //   });
    // }

    // ------------- REPOST ----------------------------------------------------------

    const postRepository = AppDataSource.getRepository(UserPost);
    let savedPost;

    if (repostedFrom) {
      const post = await postRepository.findOne({ where: { id: repostedFrom } });
      console.log(post);
      const newPost = postRepository.create({
        userId,
        title: post?.title,
        content: post?.content,
        hashtags: post?.hashtags,
        mediaKeys: post?.mediaKeys,
        repostedFrom,
        repostText,
        isRepost: Boolean(repostedFrom),
        isDiscussion: post?.isDiscussion,
        discussionContent: post?.discussionContent,
        discussionTopic: post?.discussionTopic,
        isPoll: post?.isPoll,
        pollOptions: post?.pollOptions,
        question: post?.question,
        originalPostedAt: post?.createdAt,
      });

      savedPost = await postRepository.save(newPost);
    }
    else if (isPoll && question && Array.isArray(pollOptions) && pollOptions.length > 0) {
      const newPost = postRepository.create({
        userId,
        isPoll,
        isDiscussion,
        question,
        pollOptions: pollOptions.map((option) => ({ option, votes: 0 })),
      });
      savedPost = await postRepository.save(newPost);
    }
    else if (isDiscussion && discussionTopic) {
      const newPost = postRepository.create({
        userId,
        isDiscussion,
        discussionContent,
        discussionTopic
      });

      savedPost = await postRepository.save(newPost);
    }
    else {
      // Upload files to S3
      const uploadedDocumentUrls: { key: string; type: string }[] = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          try {
            console.log('Uploading file:', file.originalname);
            const uploadedUrl = await uploadBufferDocumentToS3(file.buffer, userId, file.mimetype);
            uploadedDocumentUrls.push({
              key: uploadedUrl.fileKey,
              type: file.mimetype,
            });

          } catch (uploadError) {
            console.error('S3 Upload Error:', uploadError);
          }
        }
      }

      // Create new post entry
      const newPost = postRepository.create({
        userId,
        title,
        content,
        hashtags,
        mediaKeys: uploadedDocumentUrls,
        repostedFrom,
        repostText,
        isRepost: Boolean(repostedFrom),
      });

      savedPost = await postRepository.save(newPost);
    }

    // Handle mentions
    // let mention = null;
    // if (validMentionedUserIds.length > 0) {
    //   const mentionRepository = AppDataSource.getRepository(Mention);
    //   const mentionsToSave = validMentionedUserIds.map((mentionedUserId) =>
    //     mentionRepository.create({
    //       user: user,
    //       post: savedPost,
    //       mentionBy: userId,
    //       mentionTo: mentionedUserId,
    //     })
    //   );

    //   mention = await mentionRepository.save(mentionsToSave);

    //   // Send notifications to mentioned users
    //   for (const mentionedUser of mentionedUsers) {
    //     if (mentionedUser.id !== userId) {
    //       await sendNotification(
    //         mentionedUser.id,
    //         `${user.firstName} ${user.lastName} mentioned you in a post`,
    //         user.profilePictureUploadId,
    //         `/feed/post/${savedPost.id}`
    //       );
    //     }
    //   }
    // }

    // // Emit socket event
    // const io = getSocketInstance();
    // io.emit('postSent', { success: true, postId: savedPost.id });

    return res.status(201).json({
      message: 'Post created successfully.',
      data: savedPost,
      // mention,
    });

  } catch (error: any) {
    console.error('CreateUserPost Error:', error);
    return res.status(500).json({
      message: 'Internal server error. Could not create post.',
      error: error.message,
    });
  }
};

export const uploadMiddleware = multer({ storage: storage }).array('files', 10);


export const VoteInPoll = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { postId, selectedOption } = req.body;
    const userId = req.userId;

    if (!postId || !selectedOption) {
      return res.status(400).json({ message: "postId and selectedOption are required." });
    }

    const postRepository = AppDataSource.getRepository(UserPost);
    const pollEntryRepository = AppDataSource.getRepository(PollEntry);

    const post = await postRepository.findOne({ where: { id: postId } });

    if (!post || !post.isPoll || !post.pollOptions) {
      return res.status(400).json({ message: "Invalid poll post." });
    }

    let pollDuration = post.pollDuration;
    let createdOn = post.createdAt;

    if (pollDuration) {
      let checkDate;
      let createdDate = new Date(createdOn);

      if (pollDuration === "1 day") {
        checkDate = new Date(createdDate);
        checkDate.setDate(checkDate.getDate() + 1);
      } else if (pollDuration === "3 days") {
        checkDate = new Date(createdDate);
        checkDate.setDate(checkDate.getDate() + 3);
      } else if (pollDuration === "1 week") {
        checkDate = new Date(createdDate);
        checkDate.setDate(checkDate.getDate() + 7);
      } else if (pollDuration === "2 weeks") {
        checkDate = new Date(createdDate);
        checkDate.setDate(checkDate.getDate() + 14);
      }

      let currDate = new Date();
      if (checkDate && checkDate < currDate) {
        return res.status(400).json({ status: "error", message: "Poll is now inactive!" });
      }
    }

    const selectedOptionIndex = post.pollOptions.findIndex(option => option.option === selectedOption);
    if (selectedOptionIndex === -1) {
      return res.status(400).json({ message: "Invalid option selected." });
    }

    const existingVote = await pollEntryRepository.findOne({ where: { userId, postId } });

    if (existingVote && existingVote.status) {
      if (existingVote.selectedOption === selectedOption) {

        post.pollOptions[selectedOptionIndex].votes -= 1;
        await postRepository.save(post);

        existingVote.status = false;
        existingVote.updatedBy = "system";
        await pollEntryRepository.save(existingVote);

        return res.status(200).json({ status: "success", message: "Vote removed successfully.", data: { post } });
      } else {

        const previousOptionIndex = post.pollOptions.findIndex(option => option.option === existingVote.selectedOption);
        if (previousOptionIndex !== -1) {
          post.pollOptions[previousOptionIndex].votes -= 1;
        }

        post.pollOptions[selectedOptionIndex].votes += 1;
        await postRepository.save(post);

        existingVote.selectedOption = selectedOption;
        existingVote.updatedBy = "system";
        await pollEntryRepository.save(existingVote);

        return res.status(200).json({ status: "success", message: "Vote updated successfully.", data: { post } });
      }
    } else if (existingVote && !existingVote.status) {

      existingVote.selectedOption = selectedOption;
      existingVote.status = true;
      existingVote.updatedBy = "system";
      await pollEntryRepository.save(existingVote);

      post.pollOptions[selectedOptionIndex].votes += 1;
      await postRepository.save(post);

      return res.status(200).json({ status: "success", message: "Vote recorded successfully.", data: { post } });
    }

    post.pollOptions[selectedOptionIndex].votes += 1;
    await postRepository.save(post);

    const newPollEntry = pollEntryRepository.create({
      userId,
      postId,
      selectedOption,
      status: true,
      createdBy: "system",
      updatedBy: "system",
    });

    await pollEntryRepository.save(newPollEntry);

    return res.status(200).json({ status: "success", message: "Vote recorded successfully.", data: { post } });
  } catch (error: any) {
    console.error("VoteInPoll Error:", error);
    return res.status(500).json({ status: "error", message: "Internal server error.", error: error.message });
  }
};


// FindUserPost by userId
export const FindUserPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const profileId = req.query.profileId;

    const userId = req.userId;
    let id: any = userId;

    if (profileId) id = profileId;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Fetch user details
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOne({
      where: { id: id },
      select: ['id', 'firstName', 'lastName', 'userRole', 'profilePictureUploadId', 'bgPictureUploadId', 'badgeName', 'isBadgeOn'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Invalid User ID.' });
    }

    // Fetch user posts with pagination
    const userPostRepository = AppDataSource.getRepository(UserPost);
    const [userPosts, totalPosts] = await userPostRepository.findAndCount({
      where: { userId: id, isDiscussion: false, isHidden: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!userPosts || userPosts.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No posts found for this user.',
        data: { posts: [], totalPosts: 0, currentPage: page, totalPages: 0 },
      });
    }

    const postIds = userPosts.map((post) => post.id);

    // Fetch related comments and likes
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    const [comments, likes] = await Promise.all([
      commentRepository.find({ where: { postId: In(postIds) } }),
      likeRepository.find({ where: { postId: In(postIds), status: true } }),
    ]);

    // Fetch media URLs for posts
    // const mediaKeysWithUrls = await Promise.all(
    //   userPosts.map(async (post) => ({
    //     postId: post.id,
    //     mediaUrls: post.mediaKeys ? await Promise.all(post.mediaKeys.map((media) => generatePresignedUrl(media.key))) : [],
    //   }))
    // );

    // Format comments for each post
    const postComments = await commentRepository.find({
      where: { postId: In(postIds) },
      order: { createdAt: 'ASC' },
      take: 5, // Limit comments per post
    });

    const formattedComments = await Promise.all(
      postComments.map(async (comment) => {
        const commenter = await userRepository.findOne({
          where: { id: comment.userId },
          select: ['firstName', 'lastName'],
        });

        return {
          id: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`,
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          createdAt: comment.createdAt,
          postId: comment.postId,
        };
      })
    );

    // Fetch profile picture URL
    const imgUrl = user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null;


    // Format posts with related data
    const blockedPostRepo = AppDataSource.getRepository(BlockedPost);
    const blockedPosts = await blockedPostRepo.find({ where: { blockedBy: id } });
    const blockedPostIds = blockedPosts.map(bp => bp.blockedPost);
    const newUserPosts = userPosts.filter(post => !blockedPostIds.includes(post.id));

    const formattedPosts = await Promise.all(
      newUserPosts.map(async (post) => {
        const documentsUrls: { url: string, type: string }[] = [];
        post.mediaKeys?.map(async (media) => {
          const dUrl = await generatePresignedUrl(media.key);
          documentsUrls.push({ url: dUrl, type: media.type });
        });
        const likeCount = likes.filter((like) => like.postId === post.id).length;
        const commentCount = comments.filter((comment) => comment.postId === post.id).length;
        const likeStatus = likes.some((like) => like.postId === post.id && like.userId === id);

        let originalPUser;
        if (post?.repostedFrom) {
          const repostedPost = await userPostRepository.findOne({ where: { id: post.repostedFrom } });
          originalPUser = await userRepository.findOne({ where: { id: repostedPost?.userId } });
        }

        return {
          post: {
            Id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            mediaUrls: documentsUrls,
            likeCount,
            commentCount,
            likeStatus,
            isRepost: post.isRepost,
            repostedFrom: post.repostedFrom,
            repostText: post.repostText,
            createdAt: post.createdAt,
            originalPostedAt: post.originalPostedAt,
            originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : ''
          },
          userDetails: {
            postedId: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            // timestamp: formatTimestamp(post.createdAt),
            createdAt: post.createdAt,
            userRole: user.userRole,
            avatar: imgUrl,
            isBadgeOn: user?.isBadgeOn,
            badgeName: user?.badgeName
          },
          comments: formattedComments.filter((comment) => comment.postId === post.id),
          originalPostUser: {
            id: originalPUser?.id,
            firstName: originalPUser?.firstName || '',
            lastName: originalPUser?.lastName || '',
            avatar: originalPUser?.profilePictureUploadId ? await generatePresignedUrl(originalPUser.profilePictureUploadId) : null,
            userRole: originalPUser?.userRole,
            isBadgeOn: originalPUser?.isBadgeOn,
            badgeName: originalPUser?.badgeName
          }
        };
      })
    );

    return res.status(200).json({
      status: "success",
      message: 'User posts retrieved successfully.',
      data: {
        posts: formattedPosts,
        totalPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error: any) {
    console.error('Error retrieving user posts:', error);
    return res.status(500).json({
      status: "error",
      message: 'Internal server error. Could not retrieve user posts.',
      error: error.message,
    });
  }
};

// find and update user post
export const UpdateUserPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id, title, content, hashtags, mentionId, mediaIds, likeIds, commentIds, shareIds } = req.body;

    const userId = req.userId;

    // Check if the user ID exists in the PersonalDetails repository
    // Get the PersonalDetails repository
    const userRepository = AppDataSource.getRepository(PersonalDetails);

    // Check if the user exists
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['profilePictureUploadId', 'firstName', 'lastName', 'bio', 'occupation'],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Invalid User ID.',
      });
    }

    // Find the user post
    const userPost = await UserPost.findOne({ where: { id } });

    // Update the user post
    userPost!.title = title;
    userPost!.content = content;
    userPost!.hashtags = hashtags;

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
export const DeleteUserPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { postId } = req.params;

    const userId = req.userId;

    const userRepos = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepos.findOneBy({ id: userId });
    if (!user) {
      return res.status(400).json({ status: "fail", message: 'User Id is invalid or does not exist.' });
    }

    const userPostRepo = AppDataSource.getRepository(UserPost);
    const userPost = await userPostRepo.findOne({
      where: { id: postId, userId },
    });

    if (!userPost) {
      return res.status(400).json({ status: "fail", message: 'Post not found. Invalid Post Id.' });
    }

    await userPostRepo.delete(postId);

    return res.status(200).json({ status: "success", message: 'User post deleted successfully.' });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not delete user post.',
      status: "error",
    });
  }
};

// get user post by postId
export const GetUserPostById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { postId } = req.params;

    // Validate postId
    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required.' });
    }

    // Fetch the post
    const postRepository = AppDataSource.getRepository(UserPost);
    const post = await postRepository.findOne({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found. Invalid Post ID.' });
    }

    // Fetch related comments and likes
    const commentRepository = AppDataSource.getRepository(Comment);
    const likeRepository = AppDataSource.getRepository(Like);

    const [comments, likes] = await Promise.all([
      commentRepository.find({ where: { postId } }),
      likeRepository.find({ where: { postId, status: true } }),
    ]);

    // Fetch media URLs for the post
    // const mediaUrls = post.mediaKeys ? await Promise.all(post.mediaKeys.map((key) => generatePresignedUrl(key))) : [];

    const documentsUrls: { url: string, type: string }[] = [];

    post.mediaKeys?.map(async (media) => {
      const dUrl = await generatePresignedUrl(media.key);
      documentsUrls.push({ url: dUrl, type: media.type });
    });

    // Format comments
    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        const commenter = await AppDataSource.getRepository(PersonalDetails).findOne({
          where: { id: comment.userId },
          select: ['firstName', 'lastName'],
        });

        return {
          id: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`,
          text: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          createdAt: comment.createdAt
        };
      })
    );

    // Fetch profile picture URL
    const userId = post.userId;
    const userRepos = AppDataSource.getRepository(PersonalDetails)
    const user = await userRepos.findOne({ where: { id: userId } })
    const imgUrl = user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null;

    const getReactionId = async () => {
      const like = await likeRepository.findOne({ where: { userId } });
      return like?.reactionId;
    }

    let originalPUser;
    if (post?.repostedFrom) {
      const repostedPost = await postRepository.findOne({ where: { id: post.repostedFrom } });
      originalPUser = await userRepos.findOne({ where: { id: repostedPost?.userId } });
    }

    // Format the post with related data
    const formattedPost = {
      post: {
        Id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
        hashtags: post.hashtags,
        mediaUrls: documentsUrls,
        likeCount: likes.length,
        commentCount: comments.length,
        likeStatus: likes.some((like) => like.userId === userId),
        reactionId: await getReactionId(),
        isRepost: post.isRepost,
        repostedFrom: post.repostedFrom,
        repostText: post.repostText,
        createdAt: post.createdAt,
        originalPostedAt: post.originalPostedAt,
        originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : ''
      },
      userDetails: {
        postedId: user?.id,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        timestamp: formatTimestamp(post.createdAt),
        userRole: user?.userRole,
        avatar: imgUrl,
        isBadgeOn: user?.isBadgeOn,
        badgeName: user?.badgeName
      },
      comments: formattedComments,
      originalPostUser: {
        id: originalPUser?.id,
        firstName: originalPUser?.firstName || '',
        lastName: originalPUser?.lastName || '',
        avatar: originalPUser?.profilePictureUploadId ? await generatePresignedUrl(originalPUser.profilePictureUploadId) : null,
        userRole: originalPUser?.userRole,
        isBadgeOn: originalPUser?.isBadgeOn,
        badgeName: originalPUser?.badgeName
      }
    };

    return res.status(200).json({
      status: "success",
      message: 'Post retrieved successfully.',
      data: formattedPost,
    });
  } catch (error: any) {
    console.error('Error retrieving post:', error);
    return res.status(500).json({
      message: 'Internal server error. Could not retrieve post.',
      error: error.message,
    });
  }
};
