import { Response, Request } from "express";
import twilio from "twilio";

// Generate an Access Token
function generateToken(identity: string, roomName: string) {
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    console.log(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET
    );

    // Create a new access token with an optional TTL
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID as string,
        process.env.TWILIO_API_KEY as string,
        process.env.TWILIO_API_SECRET as string,
        {
            identity,
            ttl: 3600,
            region: "us1",
        }
    );

    token.identity = identity;

    // Grant access to the Video API
    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    return token.toJwt();
}

export const getTokenForBroadcastingAndViewing = async (req: Request, res: Response) => {
    try {
        const { identity, roomName } = req.body;
        if (!identity || !roomName) {
            return res.status(400).json({
                status: "error",
                message: "Both 'identity' and 'roomName' are required",
            });
        }

        const token = generateToken(identity, roomName);
        res.status(200).json({
            status: "success",
            message: "Token received",
            data: { token },
        });
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({
            status: "error",
            message: "Error generating token",
        });
    }
};
