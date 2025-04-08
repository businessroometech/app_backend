import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { MentionUser } from '@/api/entity/mention/mention';
import { UserPost } from '@/api/entity/UserPost';
import { NestedComment } from '@/api/entity/posts/NestedComment';
import { Comment } from '@/api/entity/posts/Comment';

export const PostMention = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      mentionTo,
      mentionBy,
      postId,
      commentId,
      nestedCommentId,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    if (!mentionBy || !mentionTo) {
      return res.status(400).json({
        status: 'error',
        message: 'enter data properly.',
      });
    }

    if (postId || commentId || nestedCommentId) {
      const mentionRepository = AppDataSource.getRepository(MentionUser);
      const userRepository = AppDataSource.getRepository(PersonalDetails);
      const postRepository = AppDataSource.getRepository(UserPost);
      const commentRepository = AppDataSource.getRepository(Comment);
      const nestedCommentRepository = AppDataSource.getRepository(NestedComment);

      const user = await userRepository.findOne({
        where: { id: mentionTo },
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Mentioned user not found',
        });
      }

      if (postId) {
        const relatedPost = await postRepository.findOne({
          where: { id: postId },
        });

        if (!relatedPost) {
          return res.status(404).json({
            status: 'error',
            message: 'Post does not exist',
          });
        }
      }

      if (commentId) {
        const commentMention = await commentRepository.findOne({
          where: { id: commentId },
        });

        if (!commentMention) {
          return res.status(404).json({
            status: 'error',
            message: 'Comment does not exist',
          });
        }
      }

      if (nestedCommentId) {
        const nestedCommentMention = await nestedCommentRepository.findOne({
          where: { id: nestedCommentId },
        });

        if (!nestedCommentMention) {
          return res.status(404).json({
            status: 'error',
            message: 'Nested Comment does not exist',
          });
        }
      }

      const mention = mentionRepository.create({
        mentionTo,
        mentionBy,
        postId,
        commentId,
        nestedCommentId,
        createdBy,
        updatedBy,
      });

      const savedMention = await mentionRepository.save(mention);

      return res.status(201).json({
        status: 'success',
        message: 'Mention created successfully.',
        data: savedMention,
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Enter valid data',
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Could not create mention.',
      error: error.message,
    });
  }
};

export const getMention = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const mentionRepository = AppDataSource.getRepository(MentionUser);

    const mention = await mentionRepository.findOne({ where: { id } });

    if (!mention) {
      return res.status(404).json({
        status: 'error',
        message: 'Mention not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: mention,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Could not retrieve mention.',
      error: error.message,
    });
  }
};

export const getAllMention = async (req: Request, res: Response): Promise<Response> => {
  try {
    const mentionRepository = AppDataSource.getRepository(MentionUser);

    const mentions = await mentionRepository.find();

    return res.status(200).json({
      status: 'success',
      data: mentions,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Could not retrieve mentions.',
      error: error.message,
    });
  }
};

export const deleteMention = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const mentionRepository = AppDataSource.getRepository(MentionUser);

    const mention = await mentionRepository.findOne({ where: { id } });

    if (!mention) {
      return res.status(404).json({
        status: 'error',
        message: 'Mention not found',
      });
    }

    await mentionRepository.remove(mention);

    return res.status(200).json({
      status: 'success',
      message: 'Mention deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Could not delete mention.',
      error: error.message,
    });
  }
};
