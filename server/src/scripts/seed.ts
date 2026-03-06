/* eslint-disable no-console -- CLI seed script requires console output */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { FaqEntry } from '../models/faq-entry.model.js';
import { Fee } from '../models/fee.model.js';
import { CategoryDefault } from '../models/category-default.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const DEV_PASSWORD = 'password123';

// ---------------------------------------------------------------------------
// Seed Users
// ---------------------------------------------------------------------------

const seedUsers = [
  {
    name: 'Alice Student',
    email: 'student@smarthostel.dev',
    role: 'STUDENT',
    block: 'A',
    floor: '2',
    roomNumber: 'A-201',
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

async function seedUsersData(): Promise<{ created: number; updated: number }> {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  let created = 0;
  let updated = 0;

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

    const isNew = result?.createdAt.getTime() === result?.updatedAt.getTime();
    if (isNew) {
      created++;
      console.log(`  Created: ${userData.name} (${userData.email}) -- role: ${userData.role}`);
    } else {
      updated++;
      console.log(`  Updated: ${userData.name} (${userData.email}) -- role: ${userData.role}`);
    }
  }

  return { created, updated };
}

// ---------------------------------------------------------------------------
// Seed FAQ Entries
// ---------------------------------------------------------------------------

interface FaqData {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

async function seedFaqEntries(): Promise<{ created: number; updated: number }> {
  const dataPath = path.resolve(__dirname, 'seed-data/faqs.json');
  const raw = await readFile(dataPath, 'utf-8');
  const faqs: FaqData[] = JSON.parse(raw);
  let created = 0;
  let updated = 0;

  for (const faq of faqs) {
    const result = await FaqEntry.findOneAndUpdate(
      { question: faq.question },
      {
        $set: {
          answer: faq.answer,
          category: faq.category,
          keywords: faq.keywords,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const isNew = result?.createdAt.getTime() === result?.updatedAt.getTime();
    if (isNew) created++;
    else updated++;
  }

  return { created, updated };
}

// ---------------------------------------------------------------------------
// Seed Category Defaults
// ---------------------------------------------------------------------------

interface CategoryDefaultData {
  category: string;
  defaultPriority: string;
  slaHours: number;
  description: string;
}

async function seedCategoryDefaults(): Promise<{ created: number; updated: number }> {
  const dataPath = path.resolve(__dirname, 'seed-data/category-defaults.json');
  const raw = await readFile(dataPath, 'utf-8');
  const categories: CategoryDefaultData[] = JSON.parse(raw);
  let created = 0;
  let updated = 0;

  for (const cat of categories) {
    const result = await CategoryDefault.findOneAndUpdate(
      { category: cat.category },
      {
        $set: {
          defaultPriority: cat.defaultPriority,
          slaHours: cat.slaHours,
          description: cat.description,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const isNew = result?.createdAt.getTime() === result?.updatedAt.getTime();
    if (isNew) created++;
    else updated++;
  }

  return { created, updated };
}

// ---------------------------------------------------------------------------
// Seed Fee Records
// ---------------------------------------------------------------------------

interface FeeData {
  feeType: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  semester: string;
  academicYear: string;
}

async function seedFeeRecords(): Promise<{ created: number; updated: number }> {
  // Find the student user to attach fees to
  const student = await User.findOne({ email: 'student@smarthostel.dev' });
  if (!student) {
    console.warn('  Warning: Student user not found -- skipping fee seeding');
    return { created: 0, updated: 0 };
  }

  const dataPath = path.resolve(__dirname, 'seed-data/fees.json');
  const raw = await readFile(dataPath, 'utf-8');
  const fees: FeeData[] = JSON.parse(raw);
  let created = 0;
  let updated = 0;

  for (const fee of fees) {
    const result = await Fee.findOneAndUpdate(
      {
        studentId: student._id,
        feeType: fee.feeType,
        semester: fee.semester,
      },
      {
        $set: {
          amount: fee.amount,
          currency: fee.currency,
          dueDate: new Date(fee.dueDate),
          status: fee.status,
          academicYear: fee.academicYear,
        },
        $setOnInsert: {
          studentId: student._id,
          feeType: fee.feeType,
          semester: fee.semester,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const isNew = result?.createdAt.getTime() === result?.updatedAt.getTime();
    if (isNew) created++;
    else updated++;
  }

  return { created, updated };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.\n');

  const summary: Record<string, { created: number; updated: number }> = {};

  console.log('[1/4] Seeding users...');
  summary.users = await seedUsersData();
  console.log(`  All users have password: ${DEV_PASSWORD}\n`);

  console.log('[2/4] Seeding FAQ entries...');
  summary.faqEntries = await seedFaqEntries();
  console.log(`  FAQ entries: ${summary.faqEntries.created} created, ${summary.faqEntries.updated} updated\n`);

  console.log('[3/4] Seeding category defaults...');
  summary.categoryDefaults = await seedCategoryDefaults();
  console.log(`  Categories: ${summary.categoryDefaults.created} created, ${summary.categoryDefaults.updated} updated\n`);

  console.log('[4/4] Seeding fee records...');
  summary.feeRecords = await seedFeeRecords();
  console.log(`  Fees: ${summary.feeRecords.created} created, ${summary.feeRecords.updated} updated\n`);

  console.log('=== Seed Summary ===');
  for (const [name, counts] of Object.entries(summary)) {
    console.log(`  ${name}: ${counts.created} created, ${counts.updated} updated`);
  }
  console.log('\nSeed complete.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
