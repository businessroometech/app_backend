import { Request, Response } from 'express';
import { getSocketInstance } from '../../../socket';
import { AppDataSource } from '../../../server';
import { Message } from '@/api/entity/chat/Message';
import { ActiveUser } from '@/api/entity/chat/ActiveUser';
import { Connection } from '@/api/entity/connection/Connections';
import { MessageHistory } from '@/api/entity/chat/MessageHistory';
import { promise } from 'zod';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { generatePresignedUrl } from '../s3/awsControllers';
import { Notify } from '@/api/entity/notify/Notify';
import { analyzeTextContent } from '../helpers/ExplicitText';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId: any = req.userId;
    const { senderId, receiverId, content, documentKeys } = req.body;

    //------------------------ explict text -----------------------------------

    const messageCheck = await analyzeTextContent(content);

    if (!messageCheck?.allowed) {
      res.status(400).json({ status: "fail", message: messageCheck?.reason });
      return;
    }

    // ---------------------------------------------------------------------------


    if (senderId !== userId) {
      return res.status(400).json({ status: "fail", message: "Invalid User" });
    }

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ status: 'error', message: 'sender id, receiverId and content is required' });
    }

    const messageRepository = AppDataSource.getRepository(Message);

    const message = messageRepository.create({
      senderId,
      receiverId,
      isSender: senderId === userId ? true : false,
      content,
      documentKeys,
    });

    await messageRepository.save(message);

    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    let mh: any = await messageHistoryRepo.findOne({
      where: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (!mh) {
      mh = messageHistoryRepo.create({
        receiverId,
        senderId,
        lastActive: new Date(),
      });

      await messageHistoryRepo.save(mh);
    } else {
      mh.lastActive = new Date();
      await messageHistoryRepo.save(mh);
    }

    const history = await messageHistoryRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
    });

    const unreadMessagesCount1 = await Promise.all(
      (history || []).map(async (his) => {
        let myId = his.receiverId === userId ? his.receiverId : his.senderId;
        let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

        const count = await messageRepository.count({
          where: { receiverId: myId, senderId: otherId, isRead: false },
        });

        return {
          senderId: otherId,
          receiverId: myId,
          unReadCount: count,
        };
      })
    );

    const io = getSocketInstance();
    const roomId = [senderId, receiverId].sort().join('-');
    // const roomId = [message.senderId, message.receiverId].sort().join('-');
    io.to(roomId).emit('newMessage', {
      message,
      messageHistoryUnreadCount: unreadMessagesCount1,
      totalUnReadCount: unreadMessagesCount1?.length,
    });

    const NotifyRepo = AppDataSource.getRepository(Notify);
    const [notifcation, notifyCount] = await NotifyRepo.findAndCount({ where: { recieverId: userId, isRead: false } });

    const messageRepo = AppDataSource.getRepository(Message);

    const unreadMessagesCount2 = (
      await Promise.all(
        (history || []).map(async (his) => {
          let myId = his.receiverId === userId ? his.receiverId : his.senderId;
          let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

          const count = await messageRepo.count({
            where: { receiverId: myId, senderId: otherId, isRead: false },
          });

          return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
        })
      )
    ).filter((item) => item !== null);

    io.to(userId).emit('initialize', {
      userId,
      welcomeMessage: 'Welcome to BusinessRoom!',
      unreadNotificationsCount: notifyCount ? notifyCount : 0,
      unreadMessagesCount: unreadMessagesCount2 ? unreadMessagesCount2.length : 0,
    });

    return res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

export const getMessagesUserWise = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'SenderId and ReceiverId are required.' });
    }

    const numericPage = page;
    const numericLimit = limit;

    if (isNaN(numericPage) || isNaN(numericLimit) || numericPage <= 0 || numericLimit <= 0) {
      return res.status(400).json({ message: 'Page and limit must be positive numbers.' });
    }

    const skip = (numericPage - 1) * numericLimit;

    const messageRepository = AppDataSource.getRepository(Message);

    const [messages, total] = await messageRepository.findAndCount({
      where: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      order: { createdAt: 'DESC' },
      skip,
      take: numericLimit,
    });

    res.status(200).json({
      status: 'success',
      message: 'Messages fetched successfully',
      data: {
        total,
        messages,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.ceil(total / numericLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages.', error });
  }
};

export const getAllUnreadMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    const receiverId = userId;

    if (!receiverId) {
      return res.status(400).json({ message: 'ReceiverId are required.' });
    }

    const messageRepository = AppDataSource.getRepository(Message);

    const result = await messageRepository
      .createQueryBuilder('message')
      .select('message.senderId', 'senderId')
      .addSelect('COUNT(message.id)', 'messageCount')
      .where('message.receiverId = :receiverId', { receiverId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .groupBy('message.senderId')
      .getRawMany();

    res.status(200).json({
      status: 'success',
      message: 'Messages fetched successfully',
      data: {
        result,
        unReadCount: result.length,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages.', error });
  }
};

export const markMessageAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { receiverId, senderId } = req.body;

    const userId: any = req.userId;

    const messageRepository = AppDataSource.getRepository(Message);

    await messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('receiverId = :receiverId AND senderId = :senderId', { receiverId, senderId })
      .execute();

    const io = getSocketInstance();

    const NotifyRepo = AppDataSource.getRepository(Notify);
    const [notifcation, notifyCount] = await NotifyRepo.findAndCount({ where: { recieverId: userId, isRead: false } });

    const messageRepo = AppDataSource.getRepository(Message);
    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    const history = await messageHistoryRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
    });

    const unreadMessagesCount = (
      await Promise.all(
        (history || []).map(async (his) => {
          let myId = his.receiverId === userId ? his.receiverId : his.senderId;
          let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

          const count = await messageRepo.count({
            where: { receiverId: myId, senderId: otherId, isRead: false },
          });

          return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
        })
      )
    ).filter((item) => item !== null);

    io.to(userId).emit('initialize', {
      userId,
      welcomeMessage: 'Welcome to BusinessRoom!',
      unreadNotificationsCount: notifyCount ? notifyCount : 0,
      unreadMessagesCount: unreadMessagesCount ? unreadMessagesCount.length : 0,
    });

    const roomId = [senderId, receiverId].sort().join('-');
    io.to(roomId).emit('messageRead');

    return res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ success: false, message: 'Error marking messages as read' });
  }
};

export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    const activeUserRepo = AppDataSource.getRepository(ActiveUser);
    const users = await activeUserRepo.find({ where: { isActive: true } });
    return res.status(200).json({ status: 'success', message: 'Fetched active users', data: { activeUsers: users } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error fetching users' });
  }
};

export const searchConnectionsByName = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const searchQuery = (req.query.name as string)?.toLowerCase().trim();

    if (!searchQuery) {
      return res.status(400).json({ status: 'fail', message: 'Search query is required' });
    }

    const connectionRepository = AppDataSource.getRepository(Connection);

    const connections = await connectionRepository.find({
      where: [
        { requesterId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' },
      ],
      relations: ['requester', 'receiver'],
    });

    const filteredConnections = connections.filter((conn) => {
      const requester = conn.requester;
      const receiver = conn.receiver;

      if (!requester || !receiver) return false;

      const requesterFullName = `${requester.firstName} ${requester.lastName}`.toLowerCase();
      const receiverFullName = `${receiver.firstName} ${receiver.lastName}`.toLowerCase();

      const isRequesterValid =
        requester.active === 1 && conn.requesterId !== userId && requesterFullName.includes(searchQuery);
      const isReceiverValid =
        receiver.active === 1 && conn.receiverId !== userId && receiverFullName.includes(searchQuery);

      return isRequesterValid || isReceiverValid;
    });

    const filteredConnectionsFinal = await Promise.all(
      filteredConnections.map(async (fil) => {
        const user = userId !== fil.receiverId ? fil.receiver : fil.requester;
        const profilePictureUploadId = user.profilePictureUploadId;

        return {
          id: user?.id,
          fullName: `${user?.firstName} ${user?.lastName}`,
          userRole: user?.userRole,
          email: user?.emailAddress,
          bio: user?.bio,
          profileImgUrl: profilePictureUploadId
            ? await generatePresignedUrl(profilePictureUploadId).catch(() => null)
            : null,
          badgeName: user?.badgeName,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      message: 'Connections retrieved successfully',
      data: filteredConnectionsFinal,
    });
  } catch (error: any) {
    console.error('Error searching connections:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const getMessageHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Sender ID is required' });
    }

    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    const history = await messageHistoryRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { createdAt: 'DESC' },
    });

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const activeUserRepo = AppDataSource.getRepository(ActiveUser);
    const messageRepository = AppDataSource.getRepository(Message);

    const unreadMessagesCount = (
      await Promise.all(
        (history || []).map(async (his) => {
          let myId = his.receiverId === userId ? his.receiverId : his.senderId;
          let otherId = his.receiverId === userId ? his.senderId : his.receiverId;

          const count = await messageRepository.count({
            where: { receiverId: myId, senderId: otherId, isRead: false },
          });

          return count > 0 ? { senderId: otherId, receiverId: myId, unReadCount: count } : null;
        })
      )
    ).filter((item) => item !== null);

    // const formattedHistory = await Promise.all(
    //   history.map(async (record) => {

    //     const userR = await userRepo.findOne({ where: { id: record.receiverId } });
    //     const activeUserR = await activeUserRepo.findOne({ where: { userId: record.receiverId } });

    //     const userS = await userRepo.findOne({ where: { id: record.senderId } });
    //     const activeUserS = await activeUserRepo.findOne({ where: { userId: record.senderId } });

    //     let myId = record.receiverId === userId ? record.receiverId : record.senderId;
    //     let otherId = record.receiverId === userId ? record.senderId : record.receiverId;

    //     const count = await messageRepository.count({
    //       where: { receiverId: myId, senderId: otherId, isRead: false },
    //     });

    //     return {
    //       id: record.id,
    //       senderId: record.senderId,
    //       receiverId: record.receiverId,
    //       lastActive: record.lastActive,
    //       createdAt: record.createdAt,
    //       updatedAt: record.updatedAt,

    //       isActiveS: activeUserS?.isActive || false,
    //       fullnameS: userS ? `${userS.firstName} ${userS.lastName}` : null,
    //       imageUrlS: userS?.profilePictureUploadId ? await generatePresignedUrl(userS.profilePictureUploadId) : null,
    //       userRoleS: userS?.userRole,
    //       bioS: userS?.bio,
    //       badgeNameS: userS?.badgeName,

    //       isActiveR: activeUserR?.isActive || false,
    //       fullnameR: userR ? `${userR.firstName} ${userR.lastName}` : null,
    //       imageUrlR: userR?.profilePictureUploadId ? await generatePresignedUrl(userR.profilePictureUploadId) : null,
    //       userRoleR: userR?.userRole,
    //       bioR: userR?.bio,
    //       badgeNameR: userR?.badgeName,

    //       unReadCount: count
    //     };
    //   })
    // );

    const formattedHistory = await Promise.all(
      history.map(async (record) => {
        // Determine the opposite user
        const isUserReceiver = record.receiverId === userId;
        const myId = isUserReceiver ? record.receiverId : record.senderId;
        const otherId = isUserReceiver ? record.senderId : record.receiverId;

        // Fetch the opposite user's details
        const otherUser = await userRepo.findOne({ where: { id: otherId } });
        const activeOtherUser = await activeUserRepo.findOne({ where: { userId: otherId } });

        // Count unread messages where the opposite user is the sender
        const count = await messageRepository.count({
          where: { receiverId: myId, senderId: otherId, isRead: false },
        });

        return {
          id: record.id,
          userId: otherId,
          isActive: activeOtherUser?.isActive || false,
          userName: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : null,
          userImg: otherUser?.profilePictureUploadId
            ? await generatePresignedUrl(otherUser.profilePictureUploadId)
            : null,
          userEmail: otherUser?.emailAddress ? otherUser?.emailAddress : null,
          userRole: otherUser?.userRole,
          userBio: otherUser?.bio,
          badgeName: otherUser?.badgeName,
          lastActive: record.lastActive,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          unReadCount: count,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      data: { history: formattedHistory, unreadUserCount: unreadMessagesCount ? unreadMessagesCount.length : 0 },
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    return res.status(500).json({ status: 'error', message: 'Error fetching message history' });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      return res.status(400).json({ message: 'Message ID is required.' });
    }

    const messageRepository = AppDataSource.getRepository(Message);
    const message = await messageRepository.findOne({ where: { id } });

    if (!message) {
      return res.status(404).json({ status: "fail", message: 'Message not found.' });
    }

    if (userId && message?.senderId !== userId) {
      return res.status(401).json({ status: "fail", message: 'You are not authorized to delete this message.' });
    }

    await messageRepository.delete(id);

    return res.status(200).json({
      status: "success",
      message: 'Message deleted successfully.',
    });

  } catch (error: any) {
    console.error('DeleteMessage Error:', error);
    return res.status(500).json({
      status: "error",
      message: 'Internal server error. Could not delete message.',
      error: error.message,
    });
  }
};
