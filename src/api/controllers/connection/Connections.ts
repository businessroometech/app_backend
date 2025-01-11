import { Request, Response } from "express";
import { Connection } from "@/api/entity/connection/Connections";
import { AppDataSource } from "@/server";
import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { request } from "node:http";
import { formatTimestamp } from "../UserPost";
import { generatePresignedUrl } from "../s3/awsControllers";
import { Brackets, In } from "typeorm";
import { UserLogin } from "@/api/entity/user/UserLogin";
import { Role } from "@/api/entity/Role/Role";

// Send a connection request
export const sendConnectionRequest = async (req: Request, res: Response): Promise<Response> => {
  const { requesterId, receiverId } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const requester = await userRepository.findOne({ where: { userId: requesterId } });
    const receiver = await userRepository.findOne({ where: { userId: receiverId } });

    if (!requester) {
      return res.status(404).json({ message: "Requester not found." });
    }
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    const existingConnection = await connectionRepository.findOne({
      where: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({ message: "Connection request already exists." });
    }
    const newConnection = connectionRepository.create({
      requesterId,
      receiverId,
      status: 'pending',
    });

    await connectionRepository.save(newConnection);

    return res.status(201).json({
      message: "Connection request sent successfully.",
      connection: newConnection,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Accept or reject a connection request
export const updateConnectionStatus = async (req: Request, res: Response): Promise<Response> => {
  const { userId, connectionId, status } = req.body;

  try {
    const connectionRepository = AppDataSource.getRepository(Connection);

    const connection = await connectionRepository.findOne({
      where: [
        { requesterId: connectionId, receiverId: userId },
      ],
    });
    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }

    if (connection.status == "accepted") {
      return res.status(400).json({ message: "Connection request already accepted" });
    }

    if (connection.status == "rejected") {
      return res.status(400).json({ message: "Connection request already rejected" });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    connection.status = status as "accepted" | "rejected";
    const data = await connectionRepository.save(connection);

    return res.status(200).json({ message: `Connection ${status} successfully.`, data });
  } catch (error: any) {
    console.error("Error updating connection status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get user's connections
export const getUserConnections = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.body;

  try {
    const connectionRepository = AppDataSource.getRepository(Connection);
    const connections = await connectionRepository.find({
      where: [
        { requesterId: userId, status: "accepted" },
        { receiverId: userId, status: "accepted" },
      ],
    });

    if (!connections || connections.length === 0) {
      return res.status(404).json({ message: "No accepted connections found." });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const userIds = [
      ...new Set(connections.map((connection) => connection.requesterId)),
      ...new Set(connections.map((connection) => connection.receiverId)),
    ];

    const users = await userRepository.find({
      where: { userId: In(userIds) },
      select: ["userId", "firstName", "lastName", "profilePictureUploadId"],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    const result = connections.map((connection) => {
      const user = users.find(
        (user) =>
          user.userId === connection.requesterId ||
          user.userId === connection.receiverId
      );

      return {
        userId: user?.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profilePictureUrl: user?.profilePictureUploadId
          ? generatePresignedUrl(user.profilePictureUploadId)
          : null,
        meeted: formatTimestamp(connection.updatedAt),
      };
    });

    return res.status(200).json({ connections: result });
  } catch (error: any) {
    console.error("Error fetching user connections:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove a connection
export const removeConnection = async (req: Request, res: Response): Promise<Response> => {
  const { connectionId } = req.params;

  try {
    const connectionRepository = AppDataSource.getRepository(Connection);

    const connection = await connectionRepository.findOneBy({ id: connectionId });

    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }

    await connectionRepository.remove(connection);

    return res.status(200).json({ message: "Connection removed successfully." });
  } catch (error: any) {
    console.error("Error removing connection:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// export const ConnectionsSuggestionController = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     const { userId, page = 1, limit = 5 } = req.body;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID is required.",
//       });
//     }

//     const userRepository = AppDataSource.getRepository(PersonalDetails);
//     const connectionRepository = AppDataSource.getRepository(Connection);
//     const userRoleRepos = AppDataSource.getRepository(Role)

//     const user = await userRepository.findOne({
//       where: { userId },
//       select: ["id", "firstName", "lastName", "occupation"],
//     });

//     const userRole = await userRoleRepos.findOne({
//       where: { userId },
//       select: ["id", "firstName", "lastName", "occupation"],
//     });






   
// };
