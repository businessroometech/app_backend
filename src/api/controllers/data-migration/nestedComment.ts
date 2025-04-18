import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { NestedComment } from '../../entity/posts/NestedComment';
import { NestedCommentNew } from '../../entity/posts/NestedCommentNew';

export async function nestedCommentMigrate(req: Request, res: Response) {
  const nestedComment = AppDataSource.getRepository(NestedComment);
  const nestedCommentNew = AppDataSource.getRepository(NestedCommentNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await nestedComment.find({});
  const data: NestedCommentNew[] = [];

  for (const element of oldData) {
    const user = await personalDetailsRepo.findOneBy({ id: element.userId });

    if (user) {
      const nestedComment = nestedCommentNew.create({
        ...element,
        userRef: user,
      });

      data.push(nestedComment);
    } else {
      console.warn(`Skipping nestedComment with missing userId: ${element.userId}`);
    }
  }

  await nestedCommentNew.save(data);
  return res.status(200).json({ success: true, message: 'nestedComment migration completed' });
}

// CREATE TABLE `NestedCommentNew` (
//   `id` CHAR(36) NOT NULL,
//   `userId` CHAR(36) NOT NULL,
//   `userRef` CHAR(36) NOT NULL,
//   `postId` CHAR(36) NOT NULL,
//   `commentId` CHAR(36) NOT NULL,
//   `text` TEXT NOT NULL,
//   `hashtags` TEXT NULL,
//   `createdBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `updatedBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//   `isChild` BOOLEAN NOT NULL DEFAULT FALSE,
//   `repliedTo` CHAR(36) NULL,
//   `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//   PRIMARY KEY (`id`),
//   CONSTRAINT `fk_nestedcomment_userRef` FOREIGN KEY (`userRef`) REFERENCES `PersonalDetails` (`id`) ON DELETE CASCADE
// );
