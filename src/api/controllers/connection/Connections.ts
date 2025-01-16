import { Request, Response } from "express";
import { Connection } from "@/api/entity/connection/Connections";
import { AppDataSource } from "@/server";
import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { request } from "node:http";
import { formatTimestamp } from "../UserPost";
import { generatePresignedUrl } from "../s3/awsControllers";
import { Brackets, In, Not } from "typeorm";

// Send a connection request
export const sendConnectionRequest = async (req: Request, res: Response): Promise<Response> => {
  const { requesterId, receiverId } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);
    const requester = await userRepository.findOne({ where: { id: requesterId } });
    const receiver = await userRepository.findOne({ where: { id: receiverId } });

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
console.log("reqest", req.body)
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
      where: { id: In(userIds) },
      select: ["id", "firstName", "lastName", "profilePictureUploadId", "userRole"],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    const result = connections.map((connection) => {
      const user = users.find(
        (user) =>
          user.id === connection.requesterId ||
          user.id === connection.receiverId
      );

      return {
        userId: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        userRole:user?.userRole,
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
  const { connectionId } = req.body;

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

// get user connection 
export const getUserConnectionRequests = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // Get user ID from request body

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const connectionRepository = AppDataSource.getRepository(Connection);

    // Fetch pending connection requests
    const connectionRequests = await connectionRepository.find({
      where: {
        receiverId: userId,
        status: "pending",
      },
    });

    if (!connectionRequests || connectionRequests.length === 0) {
      return res.status(404).json({ message: "No connection requests found." });
    }

    const userIds = [
      ...new Set(connectionRequests.map((connection) => connection.requesterId)),
    ];

    const userRepository = AppDataSource.getRepository(PersonalDetails);

    const users = await userRepository.find({
      where: { id: In(userIds) },
      select: ["id", "firstName", "lastName", "profilePictureUploadId", "userRole"],
    });

    // Create a response with connection requests and their respective user details
    const response = await Promise.all(
      connectionRequests.map(async (connection) => {
        const user = users.find((u) => u.id === connection.requesterId);
        const profilePictureUploadUrl = user?.profilePictureUploadId
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
          profilePictureUploadUrl,
        };
      })
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};


export const unsendConnectionRequest = async (req: Request, res: Response): Promise<Response> => {
  const { requesterId, receiverId } = req.body;
  try {
    const connectionRepository = AppDataSource.getRepository(Connection);
    const connection = await connectionRepository.findOne({
      where: { requesterId, receiverId, status: "pending" },
    });

    if (!connection) {
      return res.status(404).json({
        message: "Connection request not found or already processed.",
      });
    }

    await connectionRepository.remove(connection);

    return res.status(200).json({
      message: "Connection request unsent successfully.",
    });
  } catch (error: any) {
    console.error("Error unsending connection request:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const ConnectionsSuggestionController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, page = 1, limit = 5 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const connectionRepository = AppDataSource.getRepository(Connection);

    // Check if the user exists
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ["id", "firstName", "lastName", "occupation"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Fetch all connections of the user (both sent and received)
    const connections = await connectionRepository.find({
      where: [
        { requesterId: userId },
        { receiverId: userId },
        
      ],
      select: ["requesterId", "receiverId"],
    });

    // Extract all connected user IDs
    const connectedUserIds = new Set([
      ...connections.map((connection) => connection.requesterId),
      ...connections.map((connection) => connection.receiverId),
    ]);

    connectedUserIds.add(userId);

    // Fetch suggested users (users not already connected)
    const [suggestedUsers, total] = await userRepository.findAndCount({
      where: {
        id: In([...connectedUserIds.values()].map((id) => ({ id: Not(id) }))),
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Format the suggested users
    const result = await Promise.all(
      suggestedUsers.map(async (suggestedUser) => ({
        id: suggestedUser.id,
        firstName: suggestedUser.firstName,
        lastName: suggestedUser.lastName,
        occupation: suggestedUser.occupation,
        userRole: suggestedUser.userRole,
        profilePictureUrl: suggestedUser.profilePictureUploadId
          ? await generatePresignedUrl(suggestedUser.profilePictureUploadId)
          : null,
      }))
    );
    
    return res.status(200).json({
      success: true,
      message: "Suggested users fetched successfully.",
      data: result,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Error fetching connection suggestions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



