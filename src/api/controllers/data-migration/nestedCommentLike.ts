import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { NestedCommentLike } from '../../entity/posts/NestedCommentLike';
import { NestedCommentLikeNew } from '../../entity/posts/NestedCommentLikeNew';

export async function nestedCommentLikeMigrate(req: Request, res: Response) {
  const nestedCommentLike = AppDataSource.getRepository(NestedCommentLike);
  const nestedCommentLikeNew = AppDataSource.getRepository(NestedCommentLikeNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await nestedCommentLike.find({});
  const data: NestedCommentLikeNew[] = [];

  for (const element of oldData) {
    const user = await personalDetailsRepo.findOneBy({ id: element.userId });

    if (user) {
      const nestedCommentLike = nestedCommentLikeNew.create({
        ...element,
        userRef: user,
      });

      data.push(nestedCommentLike);
    } else {
      console.warn(`Skipping nestedCommentLike with missing userId: ${element.userId}`);
    }
  }

  await nestedCommentLikeNew.save(data);
  return res.status(200).json({ success: true, message: 'nestedCommentLike migration completed' });
}

// CREATE TABLE `NestedCommentLikeNew` (
//   `id` CHAR(36) NOT NULL,
//   `userId` CHAR(36) NOT NULL,
//   `userRef` CHAR(36) NOT NULL,
//   `postId` CHAR(36) NOT NULL,
//   `commentId` CHAR(36) NOT NULL,
//   `nestedCommentId` CHAR(36) NOT NULL,
//   `reactionId` INT NOT NULL DEFAULT 0,
//   `status` BOOLEAN NOT NULL DEFAULT FALSE,
//   `createdBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `updatedBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//   `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//   PRIMARY KEY (`id`),
//   CONSTRAINT `fk_nestedcommentlike_userRef` FOREIGN KEY (`userRef`) REFERENCES `PersonalDetails` (`id`) ON DELETE CASCADE
// );
