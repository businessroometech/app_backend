import { GetObjectCommand, GetObjectCommandInput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    region: process.env.AWS_REGION || 'us-east-1',
});

const generateUrlForUploading = (bucketName: any, key: string, expDate: any, type: string) => {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: type,
    });

    return getSignedUrl(s3, command, { expiresIn: expDate });
};

export const generateUploadUrl = async (req: Request, res: Response) => {
    try {
        const { bucketName, key, expDate, contentType } = req.body;

        if (!bucketName || !key || !expDate || !contentType) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Please provide bucketName, key, expDate, and contentType.' });
        }

        const url = await generateUrlForUploading(bucketName, key, expDate, contentType);
        res.status(200).json({ status: 'success', message: 'Upload URL generated successfully', data: { url } });
    } catch (error) {
        console.error('Error generating upload URL :', error);
        res.status(500).json({ status: 'error', message: 'Server error.' });
    }
};

export const generatePresignedUrl = async (key: string, bucket: string) => {
    const params: GetObjectCommandInput = {
        Bucket: bucket,
        Key: key,
    };

    const command = new GetObjectCommand(params);
    return getSignedUrl(s3, command, { expiresIn: 3600 });
};

export const getDocumentFromBucket = async (req: Request, res: Response) => {
    try {
        const {key, bucket } = req.body;

        if ((!key || !bucket)) {
            res.status(400).json({ status: 'error', message: 'Provide both key and bucket.' });
            return;
        }

        let presignedUrl = await generatePresignedUrl(bucket, key);

        return res.status(200).json({
            status: 'success',
            message: 'Document URL received',
            data: { url: presignedUrl },
        });

    } catch (error) {
        console.error('Error retrieving document:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};