import { Request, Response } from 'express';
import { getSocketInstance } from '../../../socket'; // Import your socket instance
import { AppDataSource } from '../../../server'; // Import your data source
import { Message } from '@/api/entity/chat/Message';
import { ActiveUser } from '@/api/entity/chat/ActiveUser';
import { Connection } from '@/api/entity/connection/Connections';
import { MessageHistory } from '@/api/entity/chat/MessageHistory';
import { promise } from 'zod';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { generatePresignedUrl } from '../s3/awsControllers';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, content, documentKeys } = req.body;

    const messageRepository = AppDataSource.getRepository(Message);

    const message = messageRepository.create({
      senderId,
      receiverId,
      content,
      documentKeys,
    });

    await messageRepository.save(message);

    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    let mh: any = await messageHistoryRepo.findOne({
      where: {
        senderId,
        receiverId
      }
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


    // Emit to the recipient's room
    const io = getSocketInstance();
    const roomId = `${receiverId}-${senderId}`;
    console.log("message sent to room :", roomId);

    io.to(roomId).emit('newMessage', message);
    // io.to(receiverId).emit('messageCount', message);

    return res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

// Modify getMessagesUserWise to use the existing Message instance
export const getMessagesUserWise = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "SenderId and ReceiverId are required." });
    }

    const numericPage = page;
    const numericLimit = limit;

    if (isNaN(numericPage) || isNaN(numericLimit) || numericPage <= 0 || numericLimit <= 0) {
      return res.status(400).json({ message: "Page and limit must be positive numbers." });
    }

    const skip = (numericPage - 1) * numericLimit;

    const messageRepository = AppDataSource.getRepository(Message);

    const [messages, total] = await messageRepository.findAndCount({
      where: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      order: { createdAt: "DESC" },
      skip,
      take: numericLimit,
    });

    // Decrypt messages safely
    // const decryptedMessages = messages.map((msg) => ({
    //   ...msg,
    //   content: msg.content ? new Message().decryptMessage() : null,
    // }));

    res.status(200).json({
      status: "success",
      message: "Messages fetched successfully",
      data: {
        total,
        messages,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.ceil(total / numericLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages.", error });
  }
};

export const getAllUnreadMessages = async (req: Request, res: Response) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "ReceiverId are required." });
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
      status: "success",
      message: "Messages fetched successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages.", error });
  }
};

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { receiverId, senderId } = req.body;

    const messageRepository = AppDataSource.getRepository(Message);

    await messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where("receiverId = :receiverId AND senderId = :senderId", { receiverId, senderId })
      .execute();

    // Emit event to notify about read messages
    const io = getSocketInstance();
    io.emit('messageRead');

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
    return res.status(200).json({ status: "success", message: "Fetched active users", data: { activeUsers: users } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error fetching users" });
  }
}

export const searchConnectionsByName = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const searchQuery = req.query.name as string;

    const connectionRepository = AppDataSource.getRepository(Connection);

    if (!searchQuery) {
      return res.status(400).json({ status: 'fail', message: 'Search query is required' });
    }

    const connections = await connectionRepository.find({
      where: [
        { requesterId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ],
      relations: ['requester', 'receiver']
    });


    // const filteredConnections = connections.filter(conn => {
    //   const requesterFullName = `${conn?.requester?.firstName} ${conn?.requester?.lastName}`
    //   const receiverFullName = `${conn?.receiver?.firstName} ${conn?.receiver?.lastName}`

    //   conn.requesterId !== userId
    //     ? requesterFullName.toLowerCase().includes(searchQuery.toLowerCase())
    //     : receiverFullName.toLowerCase().includes(searchQuery.toLowerCase())
    // });

    const filteredConnections = connections.filter((conn) => {
      const requesterFullName = `${conn.requester?.firstName} ${conn.requester?.lastName}`.toLowerCase();
      const receiverFullName = `${conn.receiver?.firstName} ${conn.receiver?.lastName}`.toLowerCase();

      return (
        (conn.requesterId !== userId && requesterFullName.includes(searchQuery.toLowerCase())) ||
        (conn.receiverId !== userId && receiverFullName.includes(searchQuery.toLowerCase()))
      );
    });


    return res.status(200).json({
      status: 'success',
      message: 'Connections retrieved successfully',
      data: filteredConnections
    });

  } catch (error: any) {
    console.error('Error searching connections:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getMessageHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Sender ID is required" });
    }

    const messageHistoryRepo = AppDataSource.getRepository(MessageHistory);

    const history = await messageHistoryRepo.find({
      where: { senderId: userId },
      order: { createdAt: "DESC" },
    });

    const userRepo = AppDataSource.getRepository(PersonalDetails);
    const activeUserRepo = AppDataSource.getRepository(ActiveUser);

    const formattedHistory = await Promise.all(
      history.map(async (record) => {
        const user = await userRepo.findOne({ where: { id: record.receiverId } });
        const activeUser = await activeUserRepo.findOne({ where: { userId: record.receiverId } });

        return {
          historyId: record.id,
          id: userId,
          senderId: record.senderId,
          receiverId: record.receiverId,
          lastActive: record.lastActive,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          isActive: activeUser?.isActive || false,
          fullname: user ? `${user.firstName} ${user.lastName}` : null,
          imageUrl: user?.profilePictureUploadId ? await generatePresignedUrl(user.profilePictureUploadId) : null,
          userRole: user?.userRole,
          bio: user?.bio
        };
      })
    );

    return res.status(200).json({ status: "success", data: { history: formattedHistory } });
  } catch (error) {
    console.error("Error fetching message history:", error);
    return res.status(500).json({ status: "error", message: "Error fetching message history" });
  }
};
