/**
 * @file This file defines the RedisConnection class which implements the singleton pattern
 * to maintain a single Redis connection instance throughout the application.
 */
import Redis from 'ioredis';

/**
 * RedisConnection class using the singleton pattern to manage a single Redis connection.
 * This class ensures that only one connection to the Redis server is maintained across the entire
 * application, preventing connection overhead.
 */
class RedisConnection {

  // Holds the singleton instance of Redis.
  private static instance: Redis;

  // Private constructor to prevent instantiation from outside the class.
  private constructor() {}

  /**
   * Provides access to the singleton Redis instance. If the instance does not exist, it initializes
   * a new Redis connection. If already initialized, it returns the existing instance.
   * 
   * @returns {Redis} The singleton Redis instance.
   */
  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
        RedisConnection.instance = new Redis({
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,   // Disables retries
        enableReadyCheck: false,      // Disables the ready check
      });
    }
    return RedisConnection.instance;
  }
}

export default RedisConnection;