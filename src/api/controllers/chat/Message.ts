import { Request, Response } from 'express';
import { getSocketInstance } from '../../../socket'; // Import your socket instance
import { AppDataSource } from '../../../server'; // Import your data source
import { Message } from '@/api/entity/chat/Message';
import { ActiveUser } from '@/api/entity/chat/ActiveUser';

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

    // Emit to the recipient's room
    const io = getSocketInstance();
    const roomId = `${receiverId}-${senderId}`;
    console.log("message sent to room :", roomId);

    io.to(roomId).emit('newMessage', message);

    return res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

// Modify getMessagesUserWise to use the existing Message instance
export const getMessagesUserWise = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, page = 1, limit = 10 } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "SenderId and ReceiverId are required." });
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);

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
