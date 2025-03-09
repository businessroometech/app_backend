import { Request, Response, NextFunction } from "express";
import multer from "multer";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS Rekognition
const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-north-1',
});

// Analyze image with AWS Rekognition
const analyzeImage = async (filePath: string): Promise<boolean> => {
    try {
        const imageBytes = fs.readFileSync(filePath);

        const params = {
            Image: { Bytes: imageBytes },
        };

        const response = await rekognition.detectModerationLabels(params).promise();

        return (response.ModerationLabels?.length || 0) > 0; // True if inappropriate content is detected
    } catch (error) {
        console.error("Error analyzing image:", error);
        return false;
    }
};

// Middleware to check inappropriate images
export const filterInappropriateMedia = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const filePath = path.join(__dirname, "../", req.file.path);

    const isInappropriate = await analyzeImage(filePath);

    // Delete file after analysis
    fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
    });

    if (isInappropriate) {
        return res.status(403).json({ message: "Inappropriate content detected. Upload rejected." });
    }

    next();
};