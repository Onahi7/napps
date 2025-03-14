import { createClient } from 'redis';
import { env } from './env';

// Create Redis client with environment variables
export const createRedisClient = async () => {
  const client = createClient({
    username: env.REDIS_USERNAME || 'default',
    password: env.REDIS_PASSWORD,
    socket: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT || '6379')
    }
  });

  client.on('error', err => console.log('Redis Client Error', err));

  await client.connect();
  
  return client;
};

// Create a singleton client instance
let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  return redisClient;
};