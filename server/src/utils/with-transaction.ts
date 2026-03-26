import mongoose from 'mongoose';

/**
 * Run a callback inside a MongoDB transaction (replica set required).
 * Automatically commits on success, aborts on error.
 * Falls back to running without a transaction if the MongoDB deployment
 * doesn't support them (standalone in dev/test).
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>,
): Promise<T> {
  // Check if connected to a replica set
  const topology = (mongoose.connection.getClient() as unknown as Record<string, { description?: { type?: string } }>).topology;
  const isReplicaSet = topology?.description?.type === 'ReplicaSetWithPrimary'
    || topology?.description?.type === 'Sharded';

  if (!isReplicaSet) {
    // Standalone mode — run without transaction
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
