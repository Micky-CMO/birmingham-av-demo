import mongoose from 'mongoose';

let connected = false;
let attempted = false;

/**
 * Connect to MongoDB if MONGO_URL is set. Returns null silently when unavailable
 * so callers can degrade gracefully (e.g. skip rich catalog enrichment but keep
 * Postgres-backed listings working).
 */
export async function connectMongo(uri = process.env.MONGO_URL): Promise<typeof mongoose | null> {
  if (connected) return mongoose;
  if (!uri) return null;
  if (attempted) return null;
  attempted = true;
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 4_000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    connected = true;
    return mongoose;
  } catch (err) {
    console.warn('[mongo] connection failed, continuing without:', (err as Error).message);
    return null;
  }
}

export function isMongoConnected(): boolean {
  return connected;
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
