import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

export class StorageService {
  private static instance: StorageService;
  private client: S3Client;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  private constructor() {
    try {
      // Get credentials from environment variables
      this.bucketName = env.DO_SPACES_BUCKET;
      this.region = env.DO_SPACES_REGION;
      
      // Construct endpoint dynamically using region and bucket
      this.endpoint = `https://${this.bucketName}.${this.region}.digitaloceanspaces.com`;
      
      console.log(`Initializing storage service with region: ${this.region}, bucket: ${this.bucketName}`);
      
      if (!env.DO_SPACES_KEY || !env.DO_SPACES_SECRET) {
        throw new Error('DigitalOcean Spaces credentials are missing');
      }

      this.client = new S3Client({
        endpoint: `https://${this.region}.digitaloceanspaces.com`, // endpoint for S3 client should not include bucket
        region: this.region,
        credentials: {
          accessKeyId: env.DO_SPACES_KEY,
          secretAccessKey: env.DO_SPACES_SECRET
        }
      });
      
      console.log('Storage service initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize storage service:', error);
      throw new Error(`Storage service initialization failed: ${error.message}`);
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      try {
        StorageService.instance = new StorageService();
      } catch (error: any) {
        console.error('Error creating StorageService instance:', error);
        throw error;
      }
    }
    return StorageService.instance;
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    console.log(`Uploading file: ${fileName}, type: ${mimeType}, size: ${file.length} bytes`);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ACL: 'public-read',
        ContentType: mimeType
      });

      await this.client.send(command);
      
      // Construct the public URL for the file
      const fileUrl = `${this.endpoint}/${fileName}`;
      console.log(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error: any) {
      console.error(`File upload error: ${error.message}`, error);
      
      // Provide more specific error messages based on the error type
      if (error.$metadata?.httpStatusCode === 403) {
        throw new Error('Access denied to storage. Check your credentials and permissions.');
      } else if (error.name === 'NoSuchBucket') {
        throw new Error(`Bucket '${this.bucketName}' does not exist.`);
      } else {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });

      await this.client.send(command);
      console.log(`File deleted successfully: ${fileName}`);
    } catch (error: any) {
      console.error(`File deletion error: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}