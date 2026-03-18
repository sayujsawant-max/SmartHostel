import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const DEV_PASSWORD = 'password123';

const seedUsers = [
  {
    name: 'Alice Student',
    email: 'student@smarthostel.dev',
    role: 'STUDENT',
    gender: 'FEMALE',
    academicYear: 'SECOND',
    block: 'B',
    floor: '2',
    roomNumber: 'B-202',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Bob Warden',
    email: 'warden@smarthostel.dev',
    role: 'WARDEN_ADMIN',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Charlie Guard',
    email: 'guard@smarthostel.dev',
    role: 'GUARD',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Diana Maintenance',
    email: 'maintenance@smarthostel.dev',
    role: 'MAINTENANCE',
    hasConsented: true,
    isActive: true,
  },
];

async function seed() {
  // eslint-disable-next-line no-console
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  // eslint-disable-next-line no-console
  console.log('Connected.');

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  for (const userData of seedUsers) {
    const result = await User.findOneAndUpdate(
      { email: userData.email },
      {
        $set: {
          ...userData,
          passwordHash,
        },
        $setOnInsert: {
          refreshTokenJtis: [],
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const action = result?.createdAt.getTime() === result?.updatedAt.getTime()
      ? 'Created'
      : 'Updated';
    // eslint-disable-next-line no-console
    console.log(`${action}: ${userData.name} (${userData.email}) — role: ${userData.role}`);
  }

  // eslint-disable-next-line no-console
  console.log('\nSeed complete. All users have password: password123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
