import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { UserPostNew } from '../../entity/UserPostNew';
import { UserPost } from '../../entity/UserPost';

export async function userPostMigrate(req: Request, res: Response) {
  const userPost = AppDataSource.getRepository(UserPost);
  const userPostNew = AppDataSource.getRepository(UserPostNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await userPost.find({});
  const data: UserPostNew[] = [];

  for (const element of oldData) {
    const user = await personalDetailsRepo.findOneBy({ id: element.userId });

    if (user) {
      const post = userPostNew.create({
        ...element,
        userIdRef: user,
      });

      data.push(post);
    } else {
      console.warn(`Skipping post with missing userId: ${element.userId}`);
    }
  }

  await userPostNew.save(data);
  return res.status(200).json({ success: true, message: 'userpost migration completed' });
}

// CREATE TABLE UserPostNew (
//   id CHAR(36) PRIMARY KEY,
//   userId CHAR(36) NOT NULL,
//   userIdRef CHAR(36),
//   title VARCHAR(255),
//   content TEXT,
//   hashtags TEXT,
//   mediaKeys JSON,
//   createdBy VARCHAR(255) DEFAULT 'system',
//   updatedBy VARCHAR(255) DEFAULT 'system',
//   createdAt TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
//   updatedAt TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//   isRepost BOOLEAN DEFAULT FALSE,
//   repostedFrom CHAR(36) DEFAULT NULL,
//   repostText TEXT DEFAULT NULL,
//   originalPostedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   originalPostedTimeline VARCHAR(255) NOT NULL,
//   repostCount INT NOT NULL,
//   isHidden BOOLEAN DEFAULT FALSE,
//   isDiscussion BOOLEAN DEFAULT FALSE,
//   discussionTopic VARCHAR(255),
//   discussionContent TEXT,
//   isPoll BOOLEAN DEFAULT FALSE,
//   question TEXT NOT NULL,
//   pollOptions JSON,
//   pollDuration VARCHAR(255),
//   CONSTRAINT fk_user FOREIGN KEY (userIdRef) REFERENCES PersonalDetails(id) ON DELETE CASCADE
// );
