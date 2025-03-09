import { Request, Response } from "express";
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

const client = twilio(apiKey, apiSecret, { accountSid: accountSid });

export const createRoom = async (req: Request, res: Response) => {
    try {
        const { roomName } = req.body;

        // Validate roomName
        if (!roomName || typeof roomName !== 'string') {
            return res.status(400).json({ status: "error", message: "Invalid room name" });
        }

        // Create the room
        const room = await client.video.rooms.create({
            uniqueName: roomName,
            type: 'group', // Use 'group' for multiple participants
        });
        console.log('Room created:', room.sid);
        return res.status(200).json({ status: "success", data: { room } });
    } catch (error: any) {
        console.error('Error creating room:', error);
        return res.status(500).json({
            status: "error",
            message: error.message,
            code: error.code,
            moreInfo: error.moreInfo,
        });
    }
};
export const generateToken = (req: Request, res: Response) => {
    try {
        const { identity, roomName } = req.body;

        const { AccessToken } = twilio.jwt;
        const { VideoGrant } = AccessToken;

        if (!accountSid || !apiKey || !apiSecret) {
            return res.status(400).json({ status: "error", message: "env not found" });
        }

        const token = new AccessToken(accountSid, apiKey, apiSecret, {
            identity: identity,
        });

        const videoGrant = new VideoGrant({
            room: roomName,
        });

        token.addGrant(videoGrant);
        return res.status(200).json({ status: "success", data: { token: token.toJwt() } });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error });
    }
};