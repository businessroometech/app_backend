import { Request, Response } from 'express';
import { getSocketInstance } from '../../../socket'; // Import your socket instance
import { AppDataSource } from '../../../server'; // Import your data source
import { Message } from '@/api/entity/chat/Message';

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
    io.to(receiverId).emit('newMessage', message);

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


// export const getMessagesUserWise = async (req: Request, res: Response) => {
//   try {
//     const { senderId, receiverId, page = 1, limit = 10 } = req.body;

//     // Validate senderId and receiverId
//     if (!senderId || !receiverId) {
//       return res.status(400).json({ message: "SenderId and ReceiverId are required." });
//     }

//     // Ensure page and limit are numbers
//     const numericPage = Number(page);
//     const numericLimit = Number(limit);

//     if (isNaN(numericPage) || isNaN(numericLimit) || numericPage <= 0 || numericLimit <= 0) {
//       return res.status(400).json({ message: "Page and limit must be positive numbers." });
//     }

//     const skip = (numericPage - 1) * numericLimit;

//     const messageRepository = AppDataSource.getRepository(Message);

//     const [messages, total] = await messageRepository.findAndCount({
//       where: [
//         { senderId, receiverId },
//         { senderId: receiverId, receiverId: senderId }
//       ],
//       order: { createdAt: "ASC" },
//       skip,
//       take: numericLimit,
//     });

//     // Decrypt messages
//     const decryptedMessages = messages.map((msg) => ({
//       ...msg,
//       content: new Message().decryptMessage(),
//     }));

//     res.status(200).json({
//       status: "success",
//       message: "Messages fetched successfully",
//       data: {
//         total,
//         messages: decryptedMessages,
//         page: numericPage,
//         limit: numericLimit,
//         totalPages: Math.ceil(total / numericLimit),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ message: "Failed to fetch messages.", error });
//   }
// };


export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { messageIds } = req.body;

    const messageRepository = AppDataSource.getRepository(Message);

    await messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .whereInIds(messageIds)
      .execute();

    // Emit event to notify about read messages
    const io = getSocketInstance();
    io.emit('messageRead', { messageIds });

    return res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ success: false, message: 'Error marking messages as read' });
  }
};
