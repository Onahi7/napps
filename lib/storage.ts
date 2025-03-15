import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

export class StorageService {
  private static instance: StorageService;
  private client: S3Client;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  private constructor() {
    this.bucketName = env.DO_SPACES_BUCKET;
    this.region = env.DO_SPACES_REGION;
    this.endpoint = 'https://napps-store.sfo3.digitaloceanspaces.com';

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: env.DO_SPACES_KEY,
        secretAccessKey: env.DO_SPACES_SECRET
      }
    });
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file,
      ACL: 'public-read',
      ContentType: mimeType
    });

    await this.client.send(command);
    return `${this.endpoint}/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileName
    });

    await this.client.send(command);
  }
}