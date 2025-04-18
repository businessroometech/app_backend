import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { Like } from '../../entity/posts/Like';
import { LikeNew } from '../../entity/posts/LikeNew';

export async function LikeMigrate(req: Request, res: Response) {
  const like = AppDataSource.getRepository(Like);
  const likeNew = AppDataSource.getRepository(LikeNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await like.find({});
  const data: LikeNew[] = [];

  for (const element of oldData) {
    const user = await personalDetailsRepo.findOneBy({ id: element.userId });

    if (user) {
      const like = likeNew.create({
        ...element,
        userIdRef: user,
      });

      data.push(like);
    } else {
      console.warn(`Skipping Like with missing userId: ${element.userId}`);
    }
  }

  await likeNew.save(data);
  return res.status(200).json({ success: true, message: 'Like migration completed' });
}

// CREATE TABLE `LikeNew` (
//   `id` CHAR(36) NOT NULL,
//   `userId` CHAR(36) NOT NULL,
//   `userIdRef` CHAR(36) NOT NULL,
//   `postId` CHAR(36) NOT NULL,
//   `reactionId` INT NOT NULL DEFAULT 0,
//   `status` BOOLEAN NOT NULL DEFAULT FALSE,
//   `createdBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `updatedBy` VARCHAR(255) NOT NULL DEFAULT 'system',
//   `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//   `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//   PRIMARY KEY (`id`),
//   CONSTRAINT `fk_likenew_userIdRef` FOREIGN KEY (`userIdRef`) REFERENCES `PersonalDetails`(`id`) ON DELETE CASCADE
// );
