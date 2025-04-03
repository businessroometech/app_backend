import { Request, Response } from 'express';
import { Connection } from '@/api/entity/connection/Connections';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { request } from 'node:http';
import { formatTimestamp } from '../posts/UserPost';
import { generatePresignedUrl } from '../s3/awsControllers';
import { And, Brackets, Equal, FindOptionsWhere, In, Not } from 'typeorm';
import { sendNotification } from '../notifications/SocketNotificationController';
import { getSocketInstance } from '@/socket';
import { createNotification } from '../notify/Notify';
import { NotificationType, Notify } from '@/api/entity/notify/Notify';
import { Ristriction } from '@/api/entity/ristrictions/Ristriction';
import { Message } from '@/api/entity/chat/Message';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Send a connection request
export const sendConnectionRequest = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { requesterId, receiverId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const requester = await userRepository.findOne({ where: { id: userId } });
    const receiver = await userRepository.findOne({ where: { id: receiverId } });

    if (!requester) {
      return res.status(404).json({ message: 'Requester not found.' });
    }
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }

    const existingConnection = await connectionRepository.findOne({
      where: [
        { requesterId: userId, receiverId },
        { requesterId: receiverId, receiverId: userId },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection request already exists.' });
    }
    const newConnection = connectionRepository.create({
      requesterId: userId,
      receiverId,
      status: 'pending',
    });
    await connectionRepository.save(newConnection);

    // --------------------------------------restriction---------------------------------------

    const restrictionRepo = AppDataSource.getRepository(Ristriction);

    const restrict = await restrictionRepo.findOne({ where: { userId } });

    if (restrict) {

      restrict.connectionCount -= 1;
      await restrictionRepo.save(restrict);

    }

    //------------------------------------ Notify ------------------------------------------------------------------------------------
    try {
      const imageKey = requester.profilePictureUploadId
        ? requester.profilePictureUploadId
        : null;

      await createNotification(
        NotificationType.REQUEST_RECEIVED,
        receiver.id,
        requester.id,
        `${requester.firstName} ${requester.lastName} sent you a connection Request`,
        {
          imageKey,
        }
      );

      const notifyRepo = AppDataSource.getRepository(Notify);
      const notification = await notifyRepo.find({ where: { recieverId: receiver?.id, isRead: false } });

      const notify = {
        message: `${requester.firstName} ${requester.lastName} sent you a connection Request`,
        metaData: {
          imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
          isReadCount: notification.length
        }
      }

      const io = getSocketInstance();
      const roomId = receiver.id;
      io.to(roomId).emit('newNotification', `${requester.firstName} ${requester.lastName} sent you a connection Request`);


    } catch (error) {
      console.error("Error creating notification:", error);
    }

    //------------------------------------------------------------------------------------------------------------
    return res.status(201).json({
      message: 'Connection request sent successfully.',
      connection: newConnection,
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Accept or reject a connection request
export const updateConnectionStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { connectionId, status } = req.body;
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }
  try {
    const connectionRepository = AppDataSource.getRepository(Connection);
    const connection = await connectionRepository.findOne({
      where: { requesterId: connectionId, receiverId: userId },
      relations: ['receiver', 'requester']
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found.' });
    }
    if (connection.status === 'accepted') {
      return res.status(400).json({ message: 'Connection request already accepted' });
    }
    if (connection.status === 'rejected') {
      return res.status(400).json({ message: 'Connection request already rejected' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    connection.status = status as 'accepted' | 'rejected';
    const data = await connectionRepository.save(connection);

    // ------------------------------------------Ristrictions-----not needed---------------------------

    // if (status === 'rejected') {

    //   const restrictionRepo = AppDataSource.getRepository(Ristriction);

    //   const restrict = await restrictionRepo.findOne({ where: { userId: connectionId } });

    //   if (restrict) {

    //     restrict.connectionCount += 1;
    //     await restrictionRepo.save(restrict);

    //   }

    // }

    //------------------------------------------------------------- Notify ------------------------------------------------------------------

    if (status === 'accepted') {
      try {
        const imageKey = connection.receiver?.profilePictureUploadId
          ? connection.receiver.profilePictureUploadId
          : null;

        await createNotification(
          NotificationType.REQUEST_ACCEPTED,
          connection.requester.id,
          connection.receiver.id,
          `${connection.receiver.firstName} ${connection.receiver.lastName} accepted your connection request`,
          {
            imageKey,
          }
        );

        const notifyRepo = AppDataSource.getRepository(Notify);
        const notification = await notifyRepo.find({ where: { recieverId: connection?.requester?.id, isRead: false } });


        const notify = {
          message: `${connection?.receiver?.firstName} ${connection?.receiver?.lastName} accepted your connection request`,
          metaData: {
            imageUrl: imageKey ? await generatePresignedUrl(imageKey) : null,
            isReadCount: notification.length
          }
        }

        const io = getSocketInstance();
        const roomId = connection.requester.id;
        io.to(roomId).emit('newNotification', `${connection.receiver.firstName} ${connection.receiver.lastName} accepted your connection request`);

      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------

    return res.status(200).json({
      message: `Connection request ${status} successfully`,
      connection: data
    });
  } catch (error: any) {
    console.error('Error updating connection status:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get user's connections and mutual connections
// export const getUserConnections = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {

//   let profileId = req.query.profileId;
//   const userId = req.userId;

//   if (!userId) {
//     return res.status(400).json({ message: 'User ID is required.' });
//   }

//   try {

//     console.log(profileId);
//     if (!profileId) {
//       profileId = userId;
//     }

//     const connectionRepository = AppDataSource.getRepository(Connection);
//     const messageRepository = AppDataSource.getRepository(Message);


//     const connections = await connectionRepository
//       .createQueryBuilder("connection")
//       .where("connection.requesterId = :profileId AND connection.status = 'accepted'", { profileId })
//       .orWhere("connection.receiverId = :profileId AND connection.status = 'accepted'", { profileId })
//       .getMany();


//     if (!connections || connections.length === 0) {
//       return res.status(400).json({ message: 'No accepted connections found.' });
//     }


//     const userRepository = AppDataSource.getRepository(PersonalDetails);
//     const userIds = [
//       ...new Set(connections.map((connection) => connection.requesterId)),
//       ...new Set(connections.map((connection) => connection.receiverId)),
//     ].filter((id) => id !== profileId);

//     const users = await userRepository.find({
//       where: { id: In(userIds), active: 1 },
//     });

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: 'No users found.' });
//     }

//     // Fetch all connections of the requesting user to check for mutual connections
//     const userConnections = await connectionRepository.find({
//       where: [
//         { requesterId: userId, status: 'accepted' },
//         { receiverId: userId, status: 'accepted' },
//       ],
//     });

//     const userConnectionIds = new Set(
//       userConnections.map((connection) =>
//         connection.requesterId === userId ? connection.receiverId : connection.requesterId
//       )
//     );


//     const result = await Promise.all(
//       connections.map(async (connection) => {
//         const user = users.find((user) => user.id === connection.requesterId || user.id === connection.receiverId);
//         const profilePictureUrl = user?.profilePictureUploadId
//           ? await generatePresignedUrl(user.profilePictureUploadId)
//           : null;
//         const isMutual = userConnectionIds.has(user?.id || '');

//         // Get the connection status between current user and this user
//         const userConnectionStatus = await connectionRepository.findOne({
//           where: [
//             { requesterId: userId, receiverId: user?.id },
//             { requesterId: user?.id, receiverId: userId }
//           ]
//         });

//         const isUserReceiver = connection?.receiverId === userId;
//         const myId = isUserReceiver ? connection?.receiverId : connection?.requesterId;
//         const otherId = isUserReceiver ? connection?.requesterId : connection?.receiverId;

//         const count = await messageRepository.count({
//           where: { receiverId: myId, senderId: otherId, isRead: false },
//         });

//         const lastMessage = await messageRepository.findOne({
//           where: [
//             { receiverId: myId, senderId: otherId },
//             { receiverId: otherId, senderId: myId }
//           ],
//           order: { createdAt: 'DESC' },
//           select: ['createdAt']
//         });

//         return {
//           connectionId: connection.id,
//           userId: user?.id,
//           firstName: user?.firstName,
//           lastName: user?.lastName,
//           userRole: user?.userRole,
//           profilePictureUrl: profilePictureUrl,
//           bagdeName: user?.badgeName,
//           bio: user?.bio,
//           email: user?.emailAddress,
//           meeted: connection.updatedAt ? formatTimestamp(connection.updatedAt) : formatTimestamp(connection.createdAt),
//           mutual: isMutual,
//           me: userId === connection.requesterId || userId === connection.receiverId,
//           status: userConnectionStatus?.status || null,
//           unreadMessageCount: count,
//           lastMessageTime: lastMessage?.createdAt || connection?.createdAt
//         };
//       })
//     );

//     result.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

//     return res.status(200).json({ connections: result });
//   } catch (error: any) {
//     console.error('Error fetching user connections:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

export const getUserConnections = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  // Explicitly type profileId as string
  const profileId = typeof req.query.profileId === 'string' ? req.query.profileId : undefined;
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const targetUserId = profileId || userId;

    // Initialize repositories
    const connectionRepository = AppDataSource.getRepository(Connection);
    const messageRepository = AppDataSource.getRepository(Message);
    const userRepository = AppDataSource.getRepository(PersonalDetails);

    // First verify the profile user is active with proper typing
    const profileUser = await userRepository.findOne({
      where: {
        id: targetUserId,
        active: 1
      } as FindOptionsWhere<PersonalDetails>
    });

    if (!profileUser) {
      return res.status(404).json({ message: 'Profile user not found or inactive.' });
    }

    // Get all active users upfront with proper typing
    const activeUsers = await userRepository.find({
      where: {
        active: 1
      } as FindOptionsWhere<PersonalDetails>,
      select: ['id']
    });
    const activeUserIds = activeUsers.map(user => user.id);

    // Get connections where both users are active
    const connections = await connectionRepository
      .createQueryBuilder("connection")
      .where(`(
        (connection.requesterId = :targetUserId AND connection.status = 'accepted') 
        OR 
        (connection.receiverId = :targetUserId AND connection.status = 'accepted')
      )`, { targetUserId })
      .andWhere("connection.requesterId IN (:...activeUserIds)", { activeUserIds })
      .andWhere("connection.receiverId IN (:...activeUserIds)", { activeUserIds })
      .getMany();

    if (!connections || connections.length === 0) {
      return res.status(200).json({ connections: [] });
    }

    // Get all unique connection user IDs (excluding targetUserId)
    const connectionUserIds = [
      ...new Set(
        connections.flatMap(connection =>
          [connection.requesterId, connection.receiverId].filter(id => id !== targetUserId)
        ))
    ];

    // Get active user details for these connections with proper typing
    const users = await userRepository.find({
      where: {
        id: In(connectionUserIds),
        active: 1
      } as FindOptionsWhere<PersonalDetails>,
    });

    if (!users || users.length === 0) {
      return res.status(200).json({ connections: [] });
    }

    // Get current user's connections to check for mutual connections
    const userConnections = await connectionRepository.find({
      where: [
        { requesterId: userId, status: 'accepted', receiverId: In(activeUserIds) },
        { receiverId: userId, status: 'accepted', requesterId: In(activeUserIds) }
      ] as FindOptionsWhere<Connection>[],
    });

    const userConnectionIds = new Set(
      userConnections.map(connection =>
        connection.requesterId === userId ? connection.receiverId : connection.requesterId
      )
    );

    // Format the response with proper active user checks
    const connectionResults = await Promise.all(
      connections.map(async (connection) => {
        const otherUserId = connection.requesterId === targetUserId ? connection.receiverId : connection.requesterId;
        const user = users.find(u => u.id === otherUserId);

        if (!user) return null;

        const profilePictureUrl = user.profilePictureUploadId
          ? await generatePresignedUrl(user.profilePictureUploadId)
          : null;

        const isMutual = userConnectionIds.has(user.id);

        // Get connection status between current user and this user
        const userConnectionStatus = await connectionRepository.findOne({
          where: [
            { requesterId: userId, receiverId: user.id },
            { requesterId: user.id, receiverId: userId }
          ] as FindOptionsWhere<Connection>[]
        });

        const isUserReceiver = connection.receiverId === userId;
        const myId = isUserReceiver ? connection.receiverId : connection.requesterId;
        const otherId = isUserReceiver ? connection.requesterId : connection.receiverId;

        // Get unread message count using query builder to avoid type issues
        const count = await messageRepository
          .createQueryBuilder("message")
          .where("message.receiverId = :myId", { myId })
          .andWhere("message.senderId = :otherId", { otherId })
          .andWhere("message.isRead = false")
          .andWhere("message.senderId IN (:...activeUserIds)", { activeUserIds })
          .getCount();

        // Get last message using query builder
        const lastMessage = await messageRepository
          .createQueryBuilder("message")
          .where(`(
            (message.receiverId = :myId AND message.senderId = :otherId)
            OR
            (message.receiverId = :otherId AND message.senderId = :myId)
          )`, { myId, otherId })
          .andWhere("message.senderId IN (:...activeUserIds)", { activeUserIds })
          .orderBy("message.createdAt", "DESC")
          .select(["message.createdAt"])
          .getOne();

        return {
          connectionId: connection.id,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          userRole: user.userRole,
          profilePictureUrl,
          bagdeName: user.badgeName,
          bio: user.bio,
          email: user.emailAddress,
          meeted: connection.updatedAt ? formatTimestamp(connection.updatedAt) : formatTimestamp(connection.createdAt),
          mutual: isMutual,
          me: userId === connection.requesterId || userId === connection.receiverId,
          status: userConnectionStatus?.status || null,
          unreadMessageCount: count,
          lastMessageTime: lastMessage?.createdAt || connection.createdAt
        };
      })
    );

    // Filter out null entries and sort
    const validResults = connectionResults.filter((result): result is NonNullable<typeof result> => result !== null);

    validResults.sort((a, b) => {
      const dateA = a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime);
      const dateB = b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime);
      return dateB.getTime() - dateA.getTime();
    });

    return res.status(200).json({ connections: validResults });
  } catch (error: any) {
    console.error('Error fetching user connections:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Remove a connection
export const removeConnection = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { connectionId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const connectionRepository = AppDataSource.getRepository(Connection);

    const connection = await connectionRepository.findOneBy({ id: connectionId });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found.' });
    }

    await connectionRepository.remove(connection);

    //----------------------restriction----not-needed------------------------------------------------------

    // const restrictionRepo = AppDataSource.getRepository(Ristriction);
    // const restrictConn = await restrictionRepo.findOne({ where: { userId: connectionId } });
    // const restrictMy = await restrictionRepo.findOne({ where: { userId } });

    // if (restrictConn) {
    //   restrictConn.connectionCount += 1;
    //   await restrictionRepo.save(restrictConn);
    // }

    // if (restrictMy) {
    //   restrictMy.connectionCount += 1;
    //   await restrictionRepo.save(restrictMy);
    // }
    //---------------------------------------------------------------------------------------

    return res.status(200).json({ message: 'Connection removed successfully.' });
  } catch (error: any) {
    console.error('Error removing connection:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// get user connection
export const getUserConnectionRequests = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const connectionRepository = AppDataSource.getRepository(Connection);

    // Fetch pending connection requests
    const connectionRequests = await connectionRepository.find({
      where: {
        receiverId: userId,
        status: 'pending',
      },
    });

    if (!connectionRequests || connectionRequests.length === 0) {
      return res.status(204).json({ message: 'No connection requests found.' });
    }

    const userIds = [...new Set(connectionRequests.map((connection) => connection.requesterId))];

    const userRepository = AppDataSource.getRepository(PersonalDetails);

    const users = await userRepository.find({
      where: { id: In(userIds) },
    });

    // Create a response with connection requests and their respective user details
    const response = await Promise.all(
      connectionRequests.map(async (connection) => {
        const user = users.find((u) => u.id === connection.requesterId);
        const profilePictureUrl = user?.profilePictureUploadId
          ? await generatePresignedUrl(user.profilePictureUploadId)
          : null;

        return {
          connectionId: connection.id,
          requesterId: connection.requesterId,
          receiverId: connection.receiverId,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          requesterDetails: user,
          profilePictureUrl,
        };
      })
    );


    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export const unsendConnectionRequest = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { receiverId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const connectionRepository = AppDataSource.getRepository(Connection);
    const connection = await connectionRepository.findOne({
      where: { requesterId: userId, receiverId, status: 'pending' },
    });

    if (!connection) {
      return res.status(404).json({
        message: 'Connection request not found or already processed.',
      });
    }

    await connectionRepository.remove(connection);

    // ----------------------------------------restriction------------------------------

    const restrictionRepo = AppDataSource.getRepository(Ristriction);
    const restrictMy = await restrictionRepo.findOne({ where: { userId } });

    if (restrictMy) {
      restrictMy.connectionCount += 1;
      await restrictionRepo.save(restrictMy);
    }

    //----------------------------------------------------------------------------------

    return res.status(200).json({
      message: 'Connection request unsent successfully.',
    });
  } catch (error: any) {
    console.error('Error unsending connection request:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const ConnectionsSuggestionController = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);

    // Get all connections for this user
    const connections = await connectionRepository.find({
      where: [
        { requesterId: userId },
        { receiverId: userId }
      ],
    });

    // Get IDs of users already connected with
    const connectedUserIds = connections.reduce((acc, conn) => {
      if (conn.requesterId !== userId) acc.add(conn.requesterId);
      if (conn.receiverId !== userId) acc.add(conn.receiverId);
      return acc;
    }, new Set<string>());

    // Find users not connected with yet
    const [users, total] = await userRepository.findAndCount({
      where: {
        id: Not(In([userId, ...Array.from(connectedUserIds)])), // Exclude self and connected users
        active: 1
      },
      skip: offset,
      take: Number(limit),
      order: {
        createdAt: 'DESC' // Order by newest first
      }
    });

    if (!users.length) {
      return res.status(200).json({
        success: true,
        message: "No suggestions available at this time",
        data: [],
        total: 0,
        page: Number(page),
        limit: Number(limit)
      });
    }

    // Map user details and get profile pictures
    const result = await Promise.all(
      users.map(async (user) => ({
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        occupation: user?.occupation,
        userRole: user?.userRole,
        badgeName: user?.badgeName,
        profilePictureUrl: user.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
      }))
    );

    return res.status(200).json({
      success: true,
      message: "Suggested users fetched successfully",
      data: result,
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (error: any) {
    console.error("Error fetching connection suggestions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export class ConnectionController {
  static async fetchUserConnectionsStatus(req: AuthenticatedRequest, res: Response) {
    const { status } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const requesterId = userId;
    try {
      if (!requesterId || !status) {
        return res.status(400).json({ message: 'Both requesterId and status are required.' });
      }

      const connectionRepository = AppDataSource.getRepository(Connection);

      const validStatuses = ['pending', 'accepted', 'rejected', 'block'] as const;
      type ConnectionStatus = (typeof validStatuses)[number];

      if (!validStatuses.includes(status as ConnectionStatus)) {
        return res.status(400).json({ message: `Invalid status. Valid values are: ${validStatuses.join(', ')}` });
      }

      // Fetch connections from the database
      const connections = await connectionRepository.find({
        where: { requesterId, status: status as ConnectionStatus },
        relations: ['receiver'],
      });

      if (connections.length < 1) {
        return res.status(404).json({ message: 'No connections found.' });
      }

      const connectionsWithImages = await Promise.all(connections.map(async (connection) => {
        const receiverImage = connection.receiver.profilePictureUploadId
          ? await generatePresignedUrl(connection.receiver.profilePictureUploadId)
          : null;
        return {
          ...connection,
          receiverImage
        };
      }));

      return res.status(200).json(connectionsWithImages);
    } catch (error: any) {
      console.error('Error fetching user connections status:', error);
      return res.status(500).json({
        message: 'An error occurred while fetching connections.',
        error: error.message,
      });
    }
  }
}
