import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import multer from 'multer';
import sharp from 'sharp';
import hbjs, { Handbrake } from 'handbrake-js';
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
import { createNotification } from '../notify/Notify';
import { NotificationType, Notify } from '@/api/entity/notify/Notify';

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
  // isAdmin: boolean;
}

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage: storage }).array('files', 10);


interface HandBrakeProcess {
  on(event: 'start', callback: (command: string) => void): HandBrakeProcess;
  on(event: 'progress', callback: (progress: { percentComplete: number; eta: string }) => void): HandBrakeProcess;
  on(event: 'end', callback: () => void): HandBrakeProcess;
  on(event: 'error', callback: (err: Error) => void): HandBrakeProcess;
}


async function compressVideo(videoBuffer: Buffer, userId: string, mimetype: string): Promise<{ fileKey: string; type: string }> {
  const tempInputPath = path.join(__dirname, `temp_input_${Date.now()}.mp4`);
  const tempOutputPath = path.join(__dirname, `temp_output_${Date.now()}.mp4`);

  try {
    // Save the buffer as a temporary file
    await writeFile(tempInputPath, videoBuffer);

    return new Promise((resolve, reject) => {
      const handbrakeProcess = hbjs.spawn({
        input: tempInputPath,
        output: tempOutputPath,
        preset: 'Fast 1080p30',
        quality: 24,
        format: 'mp4',
      });

      (handbrakeProcess as unknown as HandBrakeProcess)
        .on('start', (command: string) => {
          console.log('HandBrake process started with command:', command);
        })
        .on('progress', (progress: { percentComplete: number; eta: string }) => {
          console.log(
            `Progress: ${Math.round(progress.percentComplete)}% complete, ETA: ${progress.eta}`
          );
        })
        .on('end', async () => {
          console.log('Compression completed:', tempOutputPath);

          // Get the original and compressed file sizes
          const originalSize = fs.statSync(tempInputPath).size;
          const compressedSize = fs.statSync(tempOutputPath).size;

          // Log the sizes
          console.log(`Original Size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
          console.log(`Compressed Size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);

          const compressedBuffer = fs.readFileSync(tempOutputPath);

          const uploadedUrl: any = await uploadBufferDocumentToS3(compressedBuffer, userId, mimetype);

          await unlink(tempInputPath);
          await unlink(tempOutputPath);

          resolve(uploadedUrl);
        })
        .on('error', async (err: Error) => {
          console.error('Error during compression:', err);

          // Clean up temporary files in case of error
          await unlink(tempInputPath).catch(() => { });
          await unlink(tempOutputPath).catch(() => { });

          reject(err);
        });
    });
  } catch (error) {
    console.error('Compression error:', error);
    await unlink(tempInputPath).catch(() => { });
    throw error;
  }
}
// import { uploadBufferDocumentToS3 } from './s3Upload'; // Adjust based on your structure

async function compressMedia(fileBuffer: Buffer, userId: string, mimetype: string): Promise<{ fileKey: string; type: string }> {
  if (mimetype.startsWith('video/')) {
    return compressVideo(fileBuffer, userId, mimetype);
  } else if (mimetype.startsWith('image/')) {
    return compressImage(fileBuffer, userId, mimetype);
  } else {
    throw new Error('Unsupported file type');
  }
}

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


export const CreateUserPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { title, content, hashtags, repostedFrom, repostText, isDiscussion, discussionTopic, discussionContent, topic, isPoll, question, pollOptions } = req.body;
    const userId = req.userId;

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({ message: 'User ID is invalid or does not exist.' });
    }

    const postRepository = AppDataSource.getRepository(UserPost);
    let savedPost;

    if (repostedFrom) {
      const post = await postRepository.findOne({ where: { id: repostedFrom } });

      if (post) {
        post.repostCount = (post.repostCount || 0) + 1;
        await postRepository.save(post);

        const newPost = postRepository.create({
          userId,
          title: post.title,
          content: post.content,
          hashtags: post.hashtags,
          mediaKeys: post.mediaKeys,
          repostedFrom,
          repostText,
          isRepost: true,
          isDiscussion: post.isDiscussion,
          discussionContent: post.discussionContent,
          discussionTopic: post.discussionTopic,
          isPoll: post.isPoll,
          pollOptions: post.pollOptions,
          question: post.question,
          originalPostedAt: post.createdAt,
        });

        savedPost = await postRepository.save(newPost);
      }
    } else if (isPoll && question && Array.isArray(pollOptions) && pollOptions.length > 0) {
      const newPost = postRepository.create({
        userId,
        isPoll,
        isDiscussion,
        discussionTopic: topic,
        question,
        pollOptions: pollOptions.map((option) => ({ option, votes: 0 })),
      });
      savedPost = await postRepository.save(newPost);
    } else if (isDiscussion && discussionTopic) {
      const newPost = postRepository.create({
        userId,
        isDiscussion,
        discussionContent,
        discussionTopic
      });
      savedPost = await postRepository.save(newPost);
    } else {
      const uploadedDocumentUrls: { key: string; type: string }[] = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          try {
            console.log('Processing file:', file.originalname);

            let uploadedUrl;
            // if (file.mimetype.startsWith('video/')) {
            //   uploadedUrl = await compressVideo(file.buffer, String(userId), file.mimetype);
            // } else {
            //   uploadedUrl = await uploadBufferDocumentToS3(file.buffer, userId, file.mimetype);
            // }

            uploadedUrl = await compressMedia(file.buffer, String(userId), file.mimetype);

            uploadedDocumentUrls.push({
              key: uploadedUrl.fileKey,
              type: file.mimetype,
            });

          } catch (uploadError) {
            console.error('S3 Upload Error:', uploadError);
          }
        }
      }

      const newPost = postRepository.create({
        userId,
        title,
        content,
        hashtags,
        mediaKeys: uploadedDocumentUrls.length > 0 ? uploadedDocumentUrls : undefined,
        repostedFrom,
        repostText,
        isRepost: Boolean(repostedFrom),
      });

      savedPost = await postRepository.save(newPost);
    }

    if (repostedFrom) {

      const repostedByUser = await userRepository.findOne({ where: { id: userId } });
      const repostedFromPost = await postRepository.findOne({ where: { id: repostedFrom } });
      const repostedOfUser = await userRepository.findOne({ where: { id: repostedFromPost?.userId } });


      if (!repostedByUser || !repostedOfUser) {
        return res.status(400).json({ status: "error", message: "repostedByUser and repostedOfUser are required " });
      }

      try {
        const imageKey = repostedByUser?.profilePictureUploadId
          ? repostedByUser?.profilePictureUploadId
          : null;

        await createNotification(
          NotificationType.REQUEST_RECEIVED,
          repostedOfUser?.id,
          repostedByUser?.id,
          `${repostedByUser?.firstName} ${repostedByUser?.lastName} accepted your connection request`,
          {
            imageKey,
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: repostedOfUser?.id, isRead: false } });


        const notify = {
          message: `${repostedByUser?.firstName} ${repostedByUser?.lastName} accepted your connection request`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            isReadCount: notification.length
          }
        }

        const io = getSocketInstance();
        const roomId = repostedOfUser?.id;
        io.to(roomId).emit('newNotification', notify);

        io.except(userId!).emit('newPost', { post: savedPost, userId });

      } catch (error) {
        console.error("Error creating notification:", error);
      }

    }

    return res.status(201).json({
      message: 'Post created successfully.',
      data: savedPost,
    });

  } catch (error: any) {
    console.error('CreateUserPost Error:', error);
    return res.status(500).json({
      message: 'Internal server error. Could not create post.',
      error: error.message,
    });
  }
};


// const storage = multer.memoryStorage();

// export const CreateUserPost = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
//   try {

//     const { title, content, hashtags, repostedFrom, repostText, isDiscussion, discussionTopic, discussionContent, topic, isPoll, question, pollOptions } = req.body;
//     const userId = req.userId;

//     const userRepository = AppDataSource.getRepository(PersonalDetails);
//     const user = await userRepository.findOneBy({ id: userId });

//     if (!user) {
//       return res.status(400).json({ message: 'User ID is invalid or does not exist.' });
//     }

//     // ------------- REPOST ----------------------------------------------------------

//     const postRepository = AppDataSource.getRepository(UserPost);
//     let savedPost;

//     if (repostedFrom) {
//       const post = await postRepository.findOne({ where: { id: repostedFrom } });

//       if (post) {

//         post.repostCount = post.repostCount + 1;

//         console.log(post);
//         const newPost = postRepository.create({
//           userId,
//           title: post?.title,
//           content: post?.content,
//           hashtags: post?.hashtags,
//           mediaKeys: post?.mediaKeys,
//           repostedFrom,
//           repostText,
//           isRepost: Boolean(repostedFrom),
//           isDiscussion: post?.isDiscussion,
//           discussionContent: post?.discussionContent,
//           discussionTopic: post?.discussionTopic,
//           isPoll: post?.isPoll,
//           pollOptions: post?.pollOptions,
//           question: post?.question,
//           originalPostedAt: post?.createdAt,
//         });

//         savedPost = await postRepository.save(newPost);
//       }
//     }
//     else if (isPoll && question && Array.isArray(pollOptions) && pollOptions.length > 0) {
//       const newPost = postRepository.create({
//         userId,
//         isPoll,
//         isDiscussion,
//         discussionTopic: topic,
//         question,
//         pollOptions: pollOptions.map((option) => ({ option, votes: 0 })),
//       });
//       savedPost = await postRepository.save(newPost);
//     }
//     else if (isDiscussion && discussionTopic) {
//       const newPost = postRepository.create({
//         userId,
//         isDiscussion,
//         discussionContent,
//         discussionTopic
//       });

//       savedPost = await postRepository.save(newPost);
//     }
//     else {
//       // Upload files to S3
//       const uploadedDocumentUrls: { key: string; type: string }[] = [];

//       if (req.files && Array.isArray(req.files)) {
//         for (const file of req.files as Express.Multer.File[]) {
//           try {
//             console.log('Uploading file:', file.originalname);
//             const uploadedUrl = await uploadBufferDocumentToS3(file.buffer, userId, file.mimetype);
//             uploadedDocumentUrls.push({
//               key: uploadedUrl.fileKey,
//               type: file.mimetype,
//             });

//           } catch (uploadError) {
//             console.error('S3 Upload Error:', uploadError);
//           }
//         }
//       }

//       // Create new post entry
//       const newPost = postRepository.create({
//         userId,
//         title,
//         content,
//         hashtags,
//         mediaKeys: uploadedDocumentUrls.length > 0 ? uploadedDocumentUrls : undefined,
//         repostedFrom,
//         repostText,
//         isRepost: Boolean(repostedFrom),
//       });

//       savedPost = await postRepository.save(newPost);
//     }

//     // Notify

//     if (repostedFrom) {

//       const repostedByUser = await userRepository.findOne({ where: { id: userId } });
//       const repostedFromPost = await postRepository.findOne({ where: { id: repostedFrom } });
//       const repostedOfUser = await userRepository.findOne({ where: { id: repostedFromPost?.userId } });


//       if (!repostedByUser || !repostedOfUser) {
//         return res.status(400).json({ status: "error", message: "repostedByUser and repostedOfUser are required " });
//       }

//       try {
//         const reposterImageUrl = repostedByUser?.profilePictureUploadId
//           ? await generatePresignedUrl(repostedByUser?.profilePictureUploadId)
//           : null;

//         await createNotification(
//           NotificationType.REQUEST_RECEIVED,
//           repostedOfUser?.id,
//           repostedByUser?.id,
//           `${repostedByUser?.firstName} ${repostedByUser?.lastName} accepted your connection request`,
//           {
//             reposterImageUrl,
//           }
//         );
//       } catch (error) {
//         console.error("Error creating notification:", error);
//       }

//     }

//     return res.status(201).json({
//       message: 'Post created successfully.',
//       data: savedPost,
//       // mention,
//     });

//   } catch (error: any) {
//     console.error('CreateUserPost Error:', error);
//     return res.status(500).json({
//       message: 'Internal server error. Could not create post.',
//       error: error.message,
//     });
//   }
// };

// export const uploadMiddleware = multer({ storage: storage }).array('files', 10);


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
        existingVote.selectedOption = "";
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
      // select: ['id', 'firstName', 'lastName', 'userRole', 'profilePictureUploadId', 'bgPictureUploadId', 'badgeName', 'isBadgeOn'],
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
    console.log(imgUrl);

    // Format posts with related data
    const blockedPostRepo = AppDataSource.getRepository(BlockedPost);
    const blockedPosts = await blockedPostRepo.find({ where: { blockedBy: id } });
    const blockedPostIds = blockedPosts.map(bp => bp.blockedPost);
    const newUserPosts = userPosts.filter(post => !blockedPostIds.includes(post.id));

    const formattedPosts = await Promise.all(
      newUserPosts.map(async (post) => {

        const documentsUrls: { url: string, type: string }[] = [];
        await Promise.all(
          (Array.isArray(post.mediaKeys) ? post.mediaKeys : []).map(async (media) => {
            const dUrl = await generatePresignedUrl(media.key);
            documentsUrls.push({ url: dUrl, type: media.type });
          })
        );

        const likeCount = likes.filter((like) => like.postId === post.id).length;
        const commentCount = comments.filter((comment) => comment.postId === post.id).length;
        // const likeStatus = likes.some((like) => like.postId === post.id && like.userId === id);

        const like = await likeRepository.findOne({ where: { postId: post.id, userId } });

        let originalPUser;
        if (post?.repostedFrom) {
          const repostedPost = await userPostRepository.findOne({ where: { id: post.repostedFrom } });
          originalPUser = await userRepository.findOne({ where: { id: repostedPost?.userId } });
        }

        // poll

        const pollEntryRepo = AppDataSource.getRepository(PollEntry);
        const pollEntry = await pollEntryRepo.findOne({ where: { postId: post.id, userId } });

        console.log(user);

        console.log("************************************************************************************2");
        return {
          post: {
            Id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            hashtags: post.hashtags,
            mediaUrls: documentsUrls,
            reactionCount: likeCount,
            reactionId: like?.reactionId,
            commentCount,
            reactionStatus: like ? like.status : false,
            isRepost: post.isRepost,
            repostedFrom: post.repostedFrom,
            repostText: post.repostText,
            repostCount: post.repostCount,
            createdAt: post.createdAt,
            isDiscussion: post.isDiscussion,
            discussionTopic: post.discussionTopic,
            discussionContent: post.discussionContent,
            question: post.question,
            isPoll: post.isPoll,
            pollStatus: pollEntry?.status,
            pollOption: pollEntry?.selectedOption,
            postOptions: post.pollOptions,
            originalPostedAt: post.originalPostedAt,
            originalPostedTimeline: post.originalPostedAt ? formatTimestamp(post.originalPostedAt) : ''
          },
          userDetails: {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            timestamp: formatTimestamp(post.createdAt),
            createdAt: post.createdAt,
            userRole: user.userRole,
            avatar: imgUrl,
            badgeName: user?.badgeName,
            bio: user?.bio
          },
          comments: formattedComments.filter((comment) => comment.postId === post.id),
          originalPostUser: {
            id: originalPUser?.id,
            firstName: originalPUser?.firstName || '',
            lastName: originalPUser?.lastName || '',
            avatar: originalPUser?.profilePictureUploadId ? await generatePresignedUrl(originalPUser.profilePictureUploadId) : null,
            userRole: originalPUser?.userRole,
            badgeName: originalPUser?.badgeName,
            bio: originalPUser?.bio
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
      // select: ['profilePictureUploadId', 'firstName', 'lastName', 'bio', 'occupation'],
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
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: 'Unauthorized' });
    }

    const userRepos = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepos.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({ status: "fail", message: 'User Id is invalid or does not exist.' });
    }

    const userPostRepo = AppDataSource.getRepository(UserPost);
    const userPost = await userPostRepo.findOne({
      where: { id: postId },
    });

    if (!userPost) {
      return res.status(400).json({ status: "fail", message: 'Post not found. Invalid Post Id.' });
    }

    if (userPost.userId !== userId && user?.isAdmin !== true) {
      return res.status(403).json({ status: "fail", message: 'Unauthorized to delete this post' });
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

    const generateSafePresignedUrl = async (key: string) => {
      try {
        return await generatePresignedUrl(key);
      } catch (error) {
        console.error("Error generating presigned URL for key:", key, error);
        return null;
      }
    };


    const documentsUrls: { url: string, type: string }[] = [];

    await Promise.all(
      (Array.isArray(post.mediaKeys) ? post.mediaKeys : []).map(async (media) => {
        const dUrl = await generatePresignedUrl(media.key);
        documentsUrls.push({ url: dUrl, type: media.type });
      })
    );

    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        const commenter = await AppDataSource.getRepository(PersonalDetails).findOne({
          where: { id: comment?.userId },
          select: ['firstName', 'lastName'],
        });

        return {
          id: comment.id,
          commenterName: `${commenter?.firstName || ''} ${commenter?.lastName || ''}`,
          text: comment.text,
          timestamp: formatTimestamp(comment?.createdAt),
          createdAt: comment?.createdAt
        };
      })
    );

    const userId = post.userId;
    const userRepos = AppDataSource.getRepository(PersonalDetails)
    const user = await userRepos.findOne({ where: { id: userId } })
    const imgUrl = user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null;

    const like = await likeRepository.findOne({ where: { postId, userId } });

    let originalPUser;
    if (post && post.repostedFrom) {
      const repostedPost = await postRepository.findOne({ where: { id: post.repostedFrom } });

      if (repostedPost) {
        originalPUser = await userRepos.findOne({ where: { id: "3b8ba5e34776d98fc34c7e5ed0f29a42" } });
      }
    }

    // poll

    const pollEntryRepo = AppDataSource.getRepository(PollEntry);
    const pollEntry = await pollEntryRepo.findOne({ where: { postId: post.id, userId } });


    // Format the post with related data
    const formattedPost = {
      post: {
        Id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
        hashtags: post.hashtags,
        mediaUrls: documentsUrls,
        reactionCount: likes.length,
        commentCount: comments.length,
        reactionStatus: like?.status,
        reactionId: like?.reactionId,
        isRepost: post.isRepost,
        repostedFrom: post.repostedFrom,
        repostText: post.repostText,
        repostCount: post.repostCount,
        question: post.question,
        createdAt: post.createdAt,
        isDiscussion: post.isDiscussion,
        discussionTopic: post.discussionTopic,
        discussionContent: post.discussionContent,
        isPoll: post.isPoll,
        pollStatus: pollEntry?.status,
        pollOption: pollEntry?.selectedOption,
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
        badgeName: user?.badgeName,
        bio: user?.bio
      },
      comments: formattedComments,
      originalPostUser: {
        id: originalPUser?.id,
        firstName: originalPUser?.firstName || '',
        lastName: originalPUser?.lastName || '',
        avatar: originalPUser?.profilePictureUploadId ? await generatePresignedUrl(originalPUser.profilePictureUploadId) : null,
        userRole: originalPUser?.userRole,
        badgeName: originalPUser?.badgeName,
        bio: originalPUser?.bio
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
