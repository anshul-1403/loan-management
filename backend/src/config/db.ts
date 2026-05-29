import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: any = null;
export let dbError: string | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/credisea';
    console.log(`Attempting connection to MongoDB at: ${connUri}`);
    
    // Attempt local/configured connection with a 3-second timeout
    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected successfully to host: ${mongoose.connection.host}`);
    dbError = null;
  } catch (error) {
    dbError = (error as Error).message;
    console.log(`\n[Database Warn] Failed to connect to local MongoDB: ${(error as Error).message}`);
    console.log(`[Database Info] Spinning up a fallback in-memory MongoDB Server instead...`);
    
    try {
      // Dynamic import to prevent loading it if not needed, though we can import directly
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log(`[Database Info] In-memory MongoDB Server started at: ${uri}`);
      
      await mongoose.connect(uri);
      console.log('[Database Info] Connected to in-memory MongoDB successfully!');
    } catch (innerError) {
      console.error('[Database Error] Failed to start in-memory MongoDB:', (innerError as Error).message);
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[Database Info] Database disconnected successfully.');
  } catch (error) {
    console.error('[Database Error] Error during database disconnect:', error);
  }
};
