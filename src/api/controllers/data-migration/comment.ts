import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { Comment } from '../../entity/posts/Comment';
import { CommentNew } from '../../entity/posts/CommentNew';

export async function commentMigrate(req: Request, res: Response) {
  const comments = AppDataSource.getRepository(Comment);
  const commentsNew = AppDataSource.getRepository(CommentNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await Comment.find({});
  const data: CommentNew[] = [];

  for (const element of oldData) {
    const user = await personalDetailsRepo.findOneBy({ id: element.userId });

    if (user) {
      const comment = CommentNew.create({
        ...element,
        userRef: user,
      });

      data.push(comment);
    } else {
      console.warn(`Skipping comments with missing userId: ${element.userId}`);
    }
  }

  await commentsNew.save(data);
  return res.status(200).json({ success: true, message: 'comments migration completed' });
}

// CREATE TABLE `CommentNew` (
//   `id` CHAR(36) NOT NULL,
//   `userId` CHAR(36) NOT NULL,
//   `userRef` CHAR(36) NOT NULL,
//   `postId` CHAR(36) NOT NULL,
//   `text` TEXT NOT NULL,
//   `hashtags` TEXT DEFAULT NULL,
//   `mediaKeys` JSON DEFAULT NULL,
//   `createdBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `updatedBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//   `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//   PRIMARY KEY (`id`),
//   CONSTRAINT `fk_comment_userRef` FOREIGN KEY (`userRef`) REFERENCES `PersonalDetails`(`id`) ON DELETE CASCADE
// );
