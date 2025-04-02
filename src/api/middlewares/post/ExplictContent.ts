import AWS from 'aws-sdk';
import { Request, Response, NextFunction } from 'express';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
});

export const comprehend = new AWS.Comprehend();
export const rekognition = new AWS.Rekognition();

// Middleware to check for explicit text
export const checkExplicitText = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content } = req.body;
        console.log(content);
        let text = content;

        if (!text) return res.status(400).json({ message: "Text is required" });

        const params = {
            TextList: [text],
            LanguageCode: "en"
        };

        const result = await comprehend.batchDetectSentiment(params).promise();
        const sentiment = result.ResultList[0].Sentiment;

        if (sentiment === "NEGATIVE") {
            return res.status(400).json({ message: "Explicit or inappropriate content detected" });
        }

        next();
    } catch (error) {
        console.error("Error in text moderation:", error);
        res.status(500).json({ message: "Error checking text content" });
    }
};

// Middleware to check for explicit images
// export const checkExplicitImage = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//         const params = {
//             Image: { Bytes: req.file.buffer }
//         };

//         const result = await rekognition.detectModerationLabels(params).promise();
//         const hasExplicitContent = result.ModerationLabels.some(label => label.Confidence > 80);

//         if (hasExplicitContent) {
//             return res.status(400).json({ message: "Explicit image detected" });
//         }

//         next();
//     } catch (error) {
//         console.error("Error in image moderation:", error);
//         res.status(500).json({ message: "Error checking image content" });
//     }
// };
