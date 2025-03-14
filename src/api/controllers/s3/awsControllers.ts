import { GetObjectCommand, GetObjectCommandInput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';
import crypto from "crypto";
// import { promisify } from "util";
// import zlib from "zlib";

// const gzip = promisify(zlib.gzip);

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  region: 'eu-north-1',
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
    const { key, expDate, contentType } = req.body;

    const bucketName = process.env.AWS_BUCKET;

    if (!key || !expDate || !contentType) {
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

export const generatePresignedUrl = async (key: string) => {
  const params: GetObjectCommandInput = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};

export const getDocumentFromBucket = async (req: Request, res: Response) => {
  try {
    const { key } = req.body;

    if (!key) {
      res.status(400).json({ status: 'error', message: 'Provide both key and bucket.' });
      return;
    }

    const presignedUrl = await generatePresignedUrl(key);

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

export const uploadBufferDocumentToS3 = async (
  documentBuffer: Buffer,
  userId: string | undefined,
  contentType: string
): Promise<{ fileKey: string, signedUrl: string }> => {
  try {
    const fileExtension = contentType.split('/')[1] || 'bin';
    const fileKey = `uploads/${userId}/${crypto.randomUUID()}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
      Body: documentBuffer,
      ContentType: contentType,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Generate a presigned URL valid for 1 hour
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: fileKey,
      }),
      { expiresIn: 7200 }
    );

    return { fileKey, signedUrl };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Error uploading document to S3');
  }
};
