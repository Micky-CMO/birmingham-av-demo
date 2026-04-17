import mongoose from 'mongoose';

let connected = false;

export async function connectMongo(uri = process.env.MONGO_URL): Promise<typeof mongoose> {
  if (connected) return mongoose;
  if (!uri) throw new Error('MONGO_URL is not set');
  await mongoose.connect(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5_000,
    autoIndex: process.env.NODE_ENV !== 'production',
  });
  connected = true;
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
