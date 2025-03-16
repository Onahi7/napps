import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { fileUtils } from './utils';

export class StorageError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageService {
  private static instance: StorageService;
  private client: S3Client;
  private bucketName: string;
  private region: string;

  private constructor() {
    try {
      const bucketName = env.DO_SPACES_BUCKET;
      const region = env.DO_SPACES_REGION;
      const key = env.DO_SPACES_KEY;
      const secret = env.DO_SPACES_SECRET;

      if (!bucketName || !region || !key || !secret) {
        throw new StorageError('Missing required DigitalOcean Spaces configuration');
      }

      this.bucketName = bucketName;
      this.region = region;

      this.client = new S3Client({
        endpoint: `https://${this.region}.digitaloceanspaces.com`,
        region: this.region,
        credentials: {
          accessKeyId: key,
          secretAccessKey: secret
        },
        forcePathStyle: false
      });

      console.log('[Storage] Initialized with bucket:', this.bucketName);
    } catch (error: any) {
      console.error('[Storage] Initialization error:', error);
      throw new StorageError(error.message, error);
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadFile(file: Buffer, originalName: string, mimeType: string): Promise<string> {
    try {
      const fileName = fileUtils.generateFileName(originalName);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: mimeType,
        ACL: 'public-read',
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'original-name': originalName,
          'upload-time': new Date().toISOString()
        }
      });

      await this.client.send(command);

      // Return CDN URL for better performance
      return fileUtils.getCdnUrl(fileName, { 
        DO_SPACES_BUCKET: this.bucketName, 
        DO_SPACES_REGION: this.region 
      });
    } catch (error: any) {
      console.error('[Storage] Upload error:', error);
      if (error.$metadata?.httpStatusCode === 403) {
        throw new StorageError('Access denied. Please check storage permissions.', error);
      }
      throw new StorageError('Failed to upload file. Please try again.', error);
    }
  }

  async getPresignedUrl(fileName: string, mimeType: string, expiresIn: number = 600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        ContentType: mimeType,
        ACL: 'public-read',
        Metadata: {
          'original-name': fileName,
          'upload-time': new Date().toISOString()
        }
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error: any) {
      console.error('[Storage] Presigned URL generation error:', error);
      throw new StorageError('Failed to generate upload URL', error);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = fileUtils.getFileNameFromUrl(fileUrl);

      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      }));

      console.log('[Storage] File deleted successfully:', fileName);
    } catch (error: any) {
      console.error('[Storage] Delete error:', error);
      // Don't throw on delete errors, just log them
      console.warn('[Storage] Failed to delete file:', fileUrl);
    }
  }
}