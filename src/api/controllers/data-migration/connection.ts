import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';
import { Connection } from '../../entity/connection/Connections';
import { ConnectionsNew } from '../../entity/connection/ConnectionsNew';

export async function connectionMigrate(req: Request, res: Response) {
  const connection = AppDataSource.getRepository(Connection);
  const connectionNew = AppDataSource.getRepository(ConnectionsNew);
  const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

  const oldData = await connection.find({});
  const data: ConnectionsNew[] = [];

  for (const element of oldData) {
    const user1 = await personalDetailsRepo.findOneBy({ id: element.requesterId });
    const user2 = await personalDetailsRepo.findOneBy({ id: element.receiverId });

    if (user1 && user2) {
      const connection = connectionNew.create({
        ...element,
        requester: user1,
        receiver: user2,
      });

      data.push(connection);
    } else {
      console.warn(
        `Skipping connection with missing requesterId & receiverId: ${element.requesterId} and ${element.receiverId}`
      );
    }
  }

  await connectionNew.save(data);
  return res.status(200).json({ success: true, message: 'connections migration completed' });
}

// CREATE TABLE `connectionsNew` (
//   `id` CHAR(36) NOT NULL PRIMARY KEY,

//   `requester` CHAR(36) NOT NULL,
//   `requesterId` CHAR(36) NOT NULL,

//   `receiver` CHAR(36) NOT NULL,
//   `receiverId` CHAR(36) NOT NULL,

//   `status` ENUM('pending', 'accepted', 'rejected', 'block') NOT NULL DEFAULT 'pending',

//   `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//   `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

//   CONSTRAINT `fk_connectionsNew_requester` FOREIGN KEY (`requester`) REFERENCES `PersonalDetails`(`id`),
//   CONSTRAINT `fk_connectionsNew_receiver` FOREIGN KEY (`receiver`) REFERENCES `PersonalDetails`(`id`)
// );
