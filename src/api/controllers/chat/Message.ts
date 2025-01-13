import { Request, Response } from "express";
import { AppDataSource } from "@/server"; // Update to your actual DataSource file
import { Message } from "@/api/entity/chat/Message";
import { WebSocketServer } from "ws";

const messageRepository = AppDataSource.getRepository(Message);

// WebSocket instance (ensure this matches your actual setup)
let wss: WebSocketServer;

export const setWebSocketServer = (server: WebSocketServer) => {
    wss = server;
};

export const getMessagesUserWise = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId } = req.body;

        if (!senderId || !receiverId) {
            return res.status(400).json({ message: "SenderId and ReceiverId are required." });
        }

        const messages = await messageRepository.find({
            where: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            order: { createdAt: "ASC" },
        });

        res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages.", error });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId, content, documentKeys = [] } = req.body;

        if (!senderId || !receiverId || !content) {
            return res.status(400).json({ message: "SenderId, ReceiverId, and Content are required." });
        }

        const message = messageRepository.create({
            senderId,
            receiverId,
            content,
            documentKeys,
            isRead: false,
        });

        const savedMessage = await messageRepository.save(message);

        // Broadcast message to receiver via WebSocket
        wss.clients.forEach((client: any) => {
            if (client.readyState === client.OPEN && client.userId === receiverId) {
                client.send(JSON.stringify({ type: "NEW_MESSAGE", message: savedMessage }));
            }
        });

        res.status(201).json({ message: "Message sent successfully.", data: savedMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message.", error });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({ message: "MessageId is required." });
        }

        const message = await messageRepository.findOne({ where: { id: messageId } });

        if (!message) {
            return res.status(404).json({ message: "Message not found." });
        }

        message.isRead = true;
        const updatedMessage = await messageRepository.save(message);

        // Notify sender via WebSocket
        wss.clients.forEach((client: any) => {
            if (client.readyState === client.OPEN && client.userId === message.senderId) {
                client.send(JSON.stringify({ type: "MESSAGE_READ", messageId }));
            }
        });

        res.status(200).json({ message: "Message marked as read.", data: updatedMessage });
    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ message: "Failed to mark message as read.", error });
    }
};
