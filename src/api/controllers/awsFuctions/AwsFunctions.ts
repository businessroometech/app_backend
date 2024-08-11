import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';
import { Readable } from 'stream';

import { DocumentUpload } from '@/api/entity/profile/DocumentUpload';

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
    const { bucketName, key, contentType, documentType, documentDescription, documentSize } = req.body;

    if (!bucketName || !key || !contentType || !documentType || !documentDescription || !documentSize) {
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
      status: 'success',
      message: 'Document uploaded',
      data: {
        document: doc,
      },
    });
  } catch (error: any) {
    console.error('Error uploading document to DB :', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDocumentFromBucket = async (req: Request, res: Response) => {
  try {

    const { documentId } = req.body;

    const document = await DocumentUpload.findOne({ where: { id: documentId } });

    if (!document) {
      res.status(404).json({ status: "error", message: "Invalid document Id" });
      return;
    }

    const params = {
      Bucket: document.bucketName,
      Key: document.key
    }

    const command = new GetObjectCommand(params);
    const s3Object = await s3.send(command);

    res.setHeader('Content-Type', document.contentType);

    const stream = s3Object.Body as Readable;
    if (stream instanceof Readable) {
      stream.pipe(res);
    }
    else {
      res.status(500).json({ status: 'error', message: 'Unable to retrieve document content' });
    }

  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ status: "error", message: 'Internal Server Error' });
  }
}