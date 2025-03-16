import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

async function configureCors() {
  const {
    DO_SPACES_KEY,
    DO_SPACES_SECRET,
    DO_SPACES_BUCKET,
    DO_SPACES_REGION
  } = process.env;

  if (!DO_SPACES_KEY || !DO_SPACES_SECRET) {
    throw new Error('Missing required Digital Ocean Spaces credentials');
  }

  const client = new S3Client({
    endpoint: `https://${DO_SPACES_REGION}.digitaloceanspaces.com`,
    region: DO_SPACES_REGION,
    credentials: {
      accessKeyId: DO_SPACES_KEY,
      secretAccessKey: DO_SPACES_SECRET
    },
    forcePathStyle: false
  });

  const corsConfig = {
    Bucket: DO_SPACES_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedOrigins: ["https://summit.nappsnasarawa.com"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 0
        }
      ]
    }
  };

  try {
    await client.send(new PutBucketCorsCommand(corsConfig));
    console.log('CORS configuration updated successfully');
  } catch (error) {
    console.error('Failed to update CORS configuration:', error);
    process.exit(1);
  }
}

configureCors().catch(console.error);