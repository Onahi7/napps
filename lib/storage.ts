import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
      this.bucketName = env.DO_SPACES_BUCKET;
      this.region = env.DO_SPACES_REGION;

      if (!env.DO_SPACES_KEY || !env.DO_SPACES_SECRET) {
        throw new StorageError('Storage credentials are missing');
      }

      // Initialize S3 client
      this.client = new S3Client({
        endpoint: `https://${this.region}.digitaloceanspaces.com`,
        region: this.region,
        credentials: {
          accessKeyId: env.DO_SPACES_KEY,
          secretAccessKey: env.DO_SPACES_SECRET
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

      await this.client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ACL: 'public-read',
        ContentType: mimeType,
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'original-name': originalName,
          'upload-time': new Date().toISOString()
        }
      }));

      // Use CDN URL for better performance
      const fileUrl = fileUtils.getCdnUrl(fileName, { 
        DO_SPACES_BUCKET: this.bucketName, 
        DO_SPACES_REGION: this.region 
      });
      
      console.log('[Storage] File uploaded successfully:', fileUrl);
      return fileUrl;
    } catch (error: any) {
      console.error('[Storage] Upload error:', error);
      if (error.$metadata?.httpStatusCode === 403) {
        throw new StorageError('Access denied. Please check storage permissions.', error);
      }
      throw new StorageError('Failed to upload file. Please try again.', error);
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