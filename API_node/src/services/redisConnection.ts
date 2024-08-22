import Redis from 'ioredis';

/* Using the singleton pattern to maintain a single connection to Redis
   The same connection instance can be used in different parts of the application that 
   need to communicate with Redis */
class RedisConnection {
  private static instance: Redis;

  private constructor() {}

  /* If the connection to Redis has already been instantiated, the existing instance 
     is returned, otherwise a new connection instance is created */
  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
        RedisConnection.instance = new Redis({
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    }
    return RedisConnection.instance;
  }
}

export default RedisConnection;