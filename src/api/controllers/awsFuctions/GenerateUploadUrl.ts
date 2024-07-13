import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';

import { DocumentUpload } from '@/api/entity/DocumentUpload';

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

export const addDocumentUpload = async (req: Request, res: Response) => {
  try {

    const {
      bucketName,
      key,
      contentType,
      documentType,
      documentDescription,
      documentSize,
    } = req.body;

    if (!bucketName ||
      !key ||
      !contentType ||
      !documentType ||
      !documentDescription ||
      !documentSize) {
      return res.status(400).json({ status: 'error', message: 'Please provide complete data to upload in DB' });
    }

    const doc = await DocumentUpload.create({
      bucketName,
      key,
      contentType,
      documentType,
      documentDescription,
      documentSize,
    }).save();

    res.status(201).json({
      status: "success", message: "Document uploaded", data: {
        document: doc
      }
    })
  } catch (error) {
    console.error('Error uploading document to DB :', error);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
}