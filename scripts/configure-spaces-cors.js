import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { env } from '../lib/env';

async function configureCors() {
  const client = new S3Client({
    endpoint: `https://${env.DO_SPACES_REGION}.digitaloceanspaces.com`,
    region: env.DO_SPACES_REGION,
    credentials: {
      accessKeyId: env.DO_SPACES_KEY,
      secretAccessKey: env.DO_SPACES_SECRET
    },
    forcePathStyle: false
  });

  const corsConfig = {
    Bucket: env.DO_SPACES_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedOrigins: [
            "http://localhost:3000",
            "https://summit.nappsnasarawa.com"
          ],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600
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