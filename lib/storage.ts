import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { env } from './env';

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public source: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageService {
  private static instance: StorageService;
  private client: S3Client;
  private bucketName: string;
  private region: string;
  private endpoint: string;
  private cdnEndpoint: string;
  private maxRetries: number = 3;

  private constructor() {
    try {
      console.log('[StorageService] Initializing...');
      
      if (!env.DO_SPACES_KEY || !env.DO_SPACES_SECRET) {
        throw new StorageError(
          'DigitalOcean Spaces credentials are missing',
          'CREDENTIALS_MISSING',
          'initialization'
        );
      }

      this.bucketName = env.DO_SPACES_BUCKET;
      this.region = env.DO_SPACES_REGION;
      
      // Standard endpoint for direct access
      this.endpoint = `https://${this.region}.digitaloceanspaces.com`;
      
      // CDN endpoint for public access
      this.cdnEndpoint = `https://${this.bucketName}.${this.region}.cdn.digitaloceanspaces.com`;
      
      console.log(`[StorageService] Configuration: region=${this.region}, bucket=${this.bucketName}`);

      this.client = new S3Client({
        endpoint: this.endpoint,
        region: this.region,
        credentials: {
          accessKeyId: env.DO_SPACES_KEY,
          secretAccessKey: env.DO_SPACES_SECRET
        },
        forcePathStyle: false
      });
      
      // Verify bucket exists and is accessible
      this.verifyBucket().catch(error => {
        console.error('[StorageService] Bucket verification failed:', error);
        throw error;
      });
      
      console.log('[StorageService] Initialized successfully');
    } catch (error: any) {
      console.error('[StorageService] Initialization failed:', {
        error: error.message,
        code: error.code,
        source: error.source
      });
      
      if (error instanceof StorageError) {
        throw error;
      }
      
      throw new StorageError(
        `Storage service initialization failed: ${error.message}`,
        'INIT_ERROR',
        'constructor',
        error
      );
    }
  }

  private async verifyBucket(): Promise<void> {
    console.log(`[StorageService] Verifying bucket: ${this.bucketName}`);
    try {
      await this.client.send(new HeadBucketCommand({
        Bucket: this.bucketName
      }));
      console.log('[StorageService] Bucket verification successful');
    } catch (error: any) {
      console.error('[StorageService] Bucket verification error:', error);
      
      if (error.$metadata?.httpStatusCode === 404) {
        throw new StorageError(
          `Bucket '${this.bucketName}' does not exist`,
          'BUCKET_NOT_FOUND',
          'bucket-verification',
          error
        );
      } else if (error.$metadata?.httpStatusCode === 403) {
        throw new StorageError(
          'Access denied to bucket. Check your credentials and permissions',
          'ACCESS_DENIED',
          'bucket-verification',
          error
        );
      }
      
      throw new StorageError(
        'Failed to verify bucket access',
        'BUCKET_VERIFICATION_ERROR',
        'bucket-verification',
        error
      );
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      try {
        StorageService.instance = new StorageService();
      } catch (error: any) {
        console.error('[StorageService] Instance creation error:', error);
        throw error;
      }
    }
    return StorageService.instance;
  }

  private async uploadWithRetry(command: PutObjectCommand, attempt: number = 1): Promise<void> {
    try {
      await this.client.send(command);
    } catch (error: any) {
      console.error(`[StorageService] Upload attempt ${attempt} failed:`, error);
      
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[StorageService] Retrying upload in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.uploadWithRetry(command, attempt + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    const isRetryable = (
      error.name === 'NetworkingError' ||
      error.$metadata?.httpStatusCode === 429 ||
      error.$metadata?.httpStatusCode >= 500
    );
    
    console.log(`[StorageService] Error ${error.name} ${error.$metadata?.httpStatusCode} retryable: ${isRetryable}`);
    return isRetryable;
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    console.log(`[StorageService] Uploading file: ${fileName}, type=${mimeType}, size=${file.length} bytes`);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ACL: 'public-read',
        ContentType: mimeType,
        CacheControl: 'max-age=31536000',
        Metadata: {
          'uploaded-by': 'napps-summit',
          'original-mime-type': mimeType,
          'upload-timestamp': new Date().toISOString()
        }
      });

      await this.uploadWithRetry(command);
      
      const fileUrl = `${this.cdnEndpoint}/${fileName}`;
      console.log(`[StorageService] File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error: any) {
      console.error('[StorageService] File upload error:', {
        error: error.message,
        metadata: error.$metadata,
        fileName,
        mimeType
      });
      
      if (error.$metadata?.httpStatusCode === 403) {
        throw new StorageError(
          'Access denied to storage. Check your credentials and permissions.',
          'UPLOAD_ACCESS_DENIED',
          'file-upload',
          error
        );
      } else if (error.name === 'NoSuchBucket') {
        throw new StorageError(
          `Bucket '${this.bucketName}' does not exist.`,
          'BUCKET_NOT_FOUND',
          'file-upload',
          error
        );
      } else if (error.$metadata?.httpStatusCode === 413) {
        throw new StorageError(
          'File size exceeds the maximum allowed size.',
          'FILE_TOO_LARGE',
          'file-upload',
          error
        );
      } else if (error.name === 'NetworkingError') {
        throw new StorageError(
          'Network error occurred while uploading. Please check your connection and try again.',
          'NETWORK_ERROR',
          'file-upload',
          error
        );
      }
      
      throw new StorageError(
        `Failed to upload file: ${error.message}`,
        'UPLOAD_ERROR',
        'file-upload',
        error
      );
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    console.log(`[StorageService] Deleting file: ${fileName}`);
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });

      await this.client.send(command);
      console.log(`[StorageService] File deleted successfully: ${fileName}`);
    } catch (error: any) {
      console.error('[StorageService] File deletion error:', {
        error: error.message,
        metadata: error.$metadata,
        fileName
      });
      
      if (error.$metadata?.httpStatusCode === 404) {
        console.warn(`[StorageService] File ${fileName} does not exist, ignoring delete request`);
        return;
      }
      
      throw new StorageError(
        `Failed to delete file: ${error.message}`,
        'DELETE_ERROR',
        'file-deletion',
        error
      );
    }
  }
}