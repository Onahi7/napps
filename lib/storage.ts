import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

export class StorageService {
  private static instance: StorageService;
  private client: S3Client;
  private bucketName = 'napps-store';
  private region = 'sfo3';

  private constructor() {
    this.client = new S3Client({
      endpoint: `https://${this.region}.digitaloceanspaces.com`,
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
    return `https://${this.bucketName}.${this.region}.digitaloceanspaces.com/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileName
    });

    await this.client.send(command);
  }
}