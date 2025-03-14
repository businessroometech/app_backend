import { Request, Response, NextFunction } from "express";
import multer from "multer";
import AWS from "aws-sdk";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS Rekognition and S3 (for video analysis)
const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "eu-north-1",
});

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "eu-north-1",
});

const analyzeImage = async (filePath: string): Promise<boolean> => {
    try {
        const imageBytes = await fs.readFile(filePath);
        const params = {
            Image: { Bytes: imageBytes },
        };
        const response = await rekognition.detectModerationLabels(params).promise();
        return (response.ModerationLabels?.length || 0) > 0;
    } catch (error) {
        console.error("Error analyzing image:", error);
        return false; // Assume no inappropriate content if analysis fails
    }
};

export const filterInappropriateMedia = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) return next();

    try {
        const files = req.files as Express.Multer.File[];

        for (const file of files) {
            if (!file.path) {
                console.error(`❌ File ${file.originalname} has no path.`);
                return res.status(400).json({ message: `File ${file.originalname} could not be processed.` });
            }

            const filePath = path.resolve(file.path);
            const fileType = file.mimetype;
            let isInappropriate = false;

            try {
                if (fileType.startsWith("image/")) {
                    isInappropriate = await analyzeImage(filePath);
                } else if (fileType.startsWith("video/")) {
                    console.warn("Video analysis not implemented. Skipping video file:", file.originalname);
                    continue;
                } else {
                    return res.status(400).json({ message: `Unsupported file type: ${fileType}` });
                }
            } finally {
                await fs.unlink(filePath).catch(err => console.error("Error deleting file:", err));
            }

            if (isInappropriate) {
                return res.status(403).json({ message: `Inappropriate content detected in ${file.originalname}. Upload rejected.` });
            }
        }

        console.log("✅ All files verified successfully.");
        next();
    } catch (error) {
        console.error("❌ Error during media analysis:", error);
        if (error) {
            return res.status(500).json({ message: "AWS service error during media analysis." });
        } else if (error instanceof Error) {
            return res.status(500).json({ message: `Internal server error: ${error.message}` });
        } else {
            return res.status(500).json({ message: "Unknown error during media analysis." });
        }
    }
};

// Analyze video with AWS Rekognition
// const analyzeVideo = async (filePath: string): Promise<boolean> => {
//     try {
//         // Upload video to S3 for analysis
//         const bucketName = process.env.AWS_S3_BUCKET_NAME;
//         if (!bucketName) {
//             throw new Error("AWS S3 bucket name is not configured.");
//         }

//         const fileKey = `temp/${Date.now()}_${path.basename(filePath)}`;
//         const fileStream = fs.createReadStream(filePath);

//         await s3.upload({
//             Bucket: bucketName,
//             Key: fileKey,
//             Body: fileStream,
//         }).promise();

//         // Start content moderation job
//         const startModerationResponse = await rekognition.startContentModeration({
//             Video: {
//                 S3Object: {
//                     Bucket: bucketName,
//                     Name: fileKey,
//                 },
//             },
//             NotificationChannel: {
//                 SNSTopicArn: process.env.AWS_SNS_TOPIC_ARN, // Optional: For notifications
//                 RoleArn: process.env.AWS_SNS_ROLE_ARN, // Optional: For notifications
//             },
//         }).promise();

//         const jobId = startModerationResponse.JobId;
//         if (!jobId) {
//             throw new Error("Failed to start video moderation job.");
//         }

//         // Poll for moderation results
//         let moderationResult;
//         do {
//             moderationResult = await rekognition.getContentModeration({
//                 JobId: jobId,
//             }).promise();

//             if (moderationResult.JobStatus === "FAILED") {
//                 throw new Error("Video moderation job failed.");
//             }

//             // Wait for 5 seconds before polling again
//             await new Promise((resolve) => setTimeout(resolve, 5000));
//         } while (moderationResult.JobStatus === "IN_PROGRESS");

//         // Check for inappropriate content
//         const inappropriateContentDetected = (moderationResult.ModerationLabels?.length || 0) > 0;
//         return inappropriateContentDetected;
//     } catch (error) {
//         console.error("Error analyzing video:", error);
//         throw error;
//     } finally {
//         // Clean up: Delete the file from S3
//         if (fileKey) {
//             await s3.deleteObject({
//                 Bucket: bucketName,
//                 Key: fileKey,
//             }).promise();
//         }
//     }
// };

// Middleware to check inappropriate media
// export const filterInappropriateMedia = async (req: Request, res: Response, next: NextFunction) => {
//     if (!req.file) {
//         return next();
//     }

//     const filePath = path.join(__dirname, "../", req.file.path);
//     const fileType = req.file.mimetype;

//     try {
//         let isInappropriate = false;

//         if (fileType.startsWith("image/")) {
//             isInappropriate = await analyzeImage(filePath);
//         } else if (fileType.startsWith("video/")) {
//             // isInappropriate = await analyzeVideo(filePath);
//         } else {
//             return res.status(400).json({ message: "Unsupported file type." });
//         }

//         if (isInappropriate) {
//             return res.status(403).json({ message: "Inappropriate content detected. Upload rejected." });
//         }

//         console.log("************************************************  Content verified  *****************************************************");
//         next();
//     } catch (error) {
//         console.error("Error during media analysis:", error);
//         return res.status(500).json({ message: "Internal server error during media analysis." });
//     } finally {
//         // Clean up: Delete the temporary file
//         fs.unlink(filePath, (err) => {
//             if (err) console.error("Error deleting file:", err);
//         });
//     }
// };
