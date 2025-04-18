import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { CommentLike } from '../../entity/posts/CommentLike';
import { CommentLikeNew } from '../../entity/posts/CommentLikeNew';

export async function commentLikeMigrate(req: Request, res: Response) {
  const commentsLike = AppDataSource.getRepository(CommentLike);
  const commentsLikeNew = AppDataSource.getRepository(CommentLikeNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await commentsLike.find({});
  const data: CommentLikeNew[] = [];

  for (const element of oldData) {
    const user = await personalDetailsRepo.findOneBy({ id: element.userId });

    if (user) {
      const commentLike = CommentLikeNew.create({
        ...element,
        userRef: user,
      });

      data.push(commentLike);
    } else {
      console.warn(`Skipping commentsLike with missing userId: ${element.userId}`);
    }
  }

  await commentsLikeNew.save(data);
  return res.status(200).json({ success: true, message: 'commentsLike migration completed' });
}

// CREATE TABLE `CommentLikeNew` (
//   `id` CHAR(36) NOT NULL,
//   `userId` CHAR(36) NOT NULL,
//   `userRef` CHAR(36) NOT NULL,
//   `postId` CHAR(36) NOT NULL,
//   `commentId` CHAR(36) NOT NULL,
//   `status` BOOLEAN NOT NULL DEFAULT FALSE,
//   `createdBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `updatedBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//   `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//   `reactionId` INT NOT NULL DEFAULT 0,
//   PRIMARY KEY (`id`),
//   CONSTRAINT `fk_commentlike_userRef` FOREIGN KEY (`userRef`) REFERENCES `PersonalDetails`(`id`) ON DELETE CASCADE
// );
