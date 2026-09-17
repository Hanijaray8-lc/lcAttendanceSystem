import mongoose from 'mongoose';

let isConnected = false;
let connectionPromise = null;

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // If a connection is already in progress, wait for it (prevents multiple parallel connections on Vercel)
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    if (process.env.VERCEL === '1') {
      console.error('[MongoDB Error] MONGODB_URI environment variable is missing on Vercel.');
      throw new Error('MONGODB_URI environment variable is not configured.');
    }
  }

  connectionPromise = mongoose
    .connect(mongoUri || 'mongodb://127.0.0.1:27017/elms_enterprise', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    })
    .then((conn) => {
      isConnected = true;
      connectionPromise = null;
      console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    })
    .catch((error) => {
      isConnected = false;
      connectionPromise = null;
      console.error(`[MongoDB Error] Connection Failed: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};
