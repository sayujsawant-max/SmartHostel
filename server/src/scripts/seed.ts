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
import { Room } from '../models/room.model.js';
import { Leave } from '../models/leave.model.js';
import { Notice } from '../models/notice.model.js';
import { Complaint } from '../models/complaint.model.js';
import { Notification } from '../models/notification.model.js';
import { MessMenu } from '../models/mess-menu.model.js';
import { Visitor } from '../models/visitor.model.js';
import { LaundrySlot } from '../models/laundry-slot.model.js';
import { LostFound } from '../models/lost-found.model.js';
import { Feedback } from '../models/feedback.model.js';
import { ChatMessage } from '../models/chat-message.model.js';
import { Asset } from '../models/asset.model.js';
import { WellnessCheck } from '../models/wellness-check.model.js';
import { EmergencyAlert } from '../models/emergency-alert.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const DEV_PASSWORD = 'password123';
const DAY = 86_400_000;
const HOUR = 3_600_000;

// ---------------------------------------------------------------------------
// Seed Users
// ---------------------------------------------------------------------------

const seedUsers = [
  // Primary demo accounts
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
  // Additional students for believable warden pages
  {
    name: 'Rahul Sharma',
    email: 'rahul@smarthostel.dev',
    role: 'STUDENT',
    gender: 'MALE',
    academicYear: 'THIRD',
    block: 'A',
    floor: '1',
    roomNumber: 'A-101',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Priya Patel',
    email: 'priya@smarthostel.dev',
    role: 'STUDENT',
    gender: 'FEMALE',
    academicYear: 'FIRST',
    block: 'B',
    floor: '1',
    roomNumber: 'B-102',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Arjun Nair',
    email: 'arjun@smarthostel.dev',
    role: 'STUDENT',
    gender: 'MALE',
    academicYear: 'FOURTH',
    block: 'A',
    floor: '2',
    roomNumber: 'A-201',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@smarthostel.dev',
    role: 'STUDENT',
    gender: 'FEMALE',
    academicYear: 'SECOND',
    block: 'B',
    floor: '3',
    roomNumber: 'B-301',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@smarthostel.dev',
    role: 'STUDENT',
    gender: 'MALE',
    academicYear: 'THIRD',
    block: 'C',
    floor: '1',
    roomNumber: 'C-101',
    hasConsented: true,
    isActive: true,
  },
  {
    name: 'Ananya Gupta',
    email: 'ananya@smarthostel.dev',
    role: 'STUDENT',
    gender: 'FEMALE',
    academicYear: 'FIRST',
    block: 'B',
    floor: '1',
    roomNumber: 'B-101',
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
// Seed Rooms
// ---------------------------------------------------------------------------

const seedRoomsData = [
  // Block A — Boys hostel
  { block: 'A', floor: '1', roomNumber: 'A-101', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 3, feePerSemester: 25000 },
  { block: 'A', floor: '1', roomNumber: 'A-102', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 4, feePerSemester: 25000 },
  { block: 'A', floor: '1', roomNumber: 'A-103', hostelGender: 'BOYS', roomType: 'DELUXE', acType: 'AC', totalBeds: 2, occupiedBeds: 1, feePerSemester: 45000 },
  { block: 'A', floor: '2', roomNumber: 'A-201', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 2, feePerSemester: 25000 },
  { block: 'A', floor: '2', roomNumber: 'A-202', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'AC', totalBeds: 3, occupiedBeds: 3, feePerSemester: 35000 },
  { block: 'A', floor: '2', roomNumber: 'A-203', hostelGender: 'BOYS', roomType: 'DELUXE', acType: 'AC', totalBeds: 2, occupiedBeds: 0, feePerSemester: 45000 },
  { block: 'A', floor: '3', roomNumber: 'A-301', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 1, feePerSemester: 25000 },
  { block: 'A', floor: '3', roomNumber: 'A-302', hostelGender: 'BOYS', roomType: 'DELUXE', acType: 'AC', totalBeds: 2, occupiedBeds: 2, feePerSemester: 45000 },
  // Block B — Girls hostel
  { block: 'B', floor: '1', roomNumber: 'B-101', hostelGender: 'GIRLS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 2, feePerSemester: 25000 },
  { block: 'B', floor: '1', roomNumber: 'B-102', hostelGender: 'GIRLS', roomType: 'NORMAL', acType: 'AC', totalBeds: 3, occupiedBeds: 1, feePerSemester: 35000 },
  { block: 'B', floor: '1', roomNumber: 'B-103', hostelGender: 'GIRLS', roomType: 'DELUXE', acType: 'AC', totalBeds: 2, occupiedBeds: 2, feePerSemester: 45000 },
  { block: 'B', floor: '2', roomNumber: 'B-201', hostelGender: 'GIRLS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 0, feePerSemester: 25000 },
  { block: 'B', floor: '2', roomNumber: 'B-202', hostelGender: 'GIRLS', roomType: 'DELUXE', acType: 'AC', totalBeds: 2, occupiedBeds: 1, feePerSemester: 45000 },
  { block: 'B', floor: '3', roomNumber: 'B-301', hostelGender: 'GIRLS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, occupiedBeds: 3, feePerSemester: 25000 },
  { block: 'B', floor: '3', roomNumber: 'B-302', hostelGender: 'GIRLS', roomType: 'NORMAL', acType: 'AC', totalBeds: 3, occupiedBeds: 2, feePerSemester: 35000 },
  // Block C — Boys hostel (larger block)
  { block: 'C', floor: '1', roomNumber: 'C-101', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 6, occupiedBeds: 5, feePerSemester: 20000 },
  { block: 'C', floor: '1', roomNumber: 'C-102', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 6, occupiedBeds: 4, feePerSemester: 20000 },
  { block: 'C', floor: '2', roomNumber: 'C-201', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'AC', totalBeds: 4, occupiedBeds: 2, feePerSemester: 35000 },
  { block: 'C', floor: '2', roomNumber: 'C-202', hostelGender: 'BOYS', roomType: 'DELUXE', acType: 'AC', totalBeds: 2, occupiedBeds: 0, feePerSemester: 50000 },
  { block: 'C', floor: '3', roomNumber: 'C-301', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 6, occupiedBeds: 6, feePerSemester: 20000 },
];

async function seedRooms(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const room of seedRoomsData) {
    const result = await Room.findOneAndUpdate(
      { block: room.block, roomNumber: room.roomNumber },
      { $set: { ...room, isActive: true } },
      { upsert: true, returnDocument: 'after' },
    );

    const isNew = result?.createdAt.getTime() === result?.updatedAt.getTime();
    if (isNew) created++;
    else updated++;
  }

  return { created, updated };
}

// ---------------------------------------------------------------------------
// Seed Leaves (multi-student demo data)
// ---------------------------------------------------------------------------

async function seedLeaves(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const arjun = await User.findOne({ email: 'arjun@smarthostel.dev' });
  const sneha = await User.findOne({ email: 'sneha@smarthostel.dev' });
  const vikram = await User.findOne({ email: 'vikram@smarthostel.dev' });
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!alice || !warden) return { created: 0 };

  // Clear existing seed leaves for all students
  const studentIds = [alice, rahul, priya, arjun, sneha, vikram].filter(Boolean).map((s) => s!._id);
  await Leave.deleteMany({ studentId: { $in: studentIds } });

  const now = new Date();
  const leaves = [
    // Alice's leaves (primary demo student)
    {
      studentId: alice._id,
      type: 'OVERNIGHT',
      startDate: new Date(now.getTime() - 10 * DAY),
      endDate: new Date(now.getTime() - 8 * DAY),
      reason: 'Attending a family wedding in Pune',
      status: 'COMPLETED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 11 * DAY),
    },
    {
      studentId: alice._id,
      type: 'DAY_OUTING',
      startDate: new Date(now.getTime() - 5 * DAY),
      endDate: new Date(now.getTime() - 5 * DAY),
      reason: 'Doctor appointment at city hospital',
      status: 'COMPLETED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 6 * DAY),
    },
    {
      studentId: alice._id,
      type: 'DAY_OUTING',
      startDate: new Date(now.getTime() - 2 * DAY),
      endDate: new Date(now.getTime() - 2 * DAY),
      reason: 'Shopping for project supplies',
      status: 'REJECTED',
      rejectionReason: 'Too many recent leaves, please wait a week',
    },
    {
      studentId: alice._id,
      type: 'OVERNIGHT',
      startDate: new Date(now.getTime() + 3 * DAY),
      endDate: new Date(now.getTime() + 5 * DAY),
      reason: 'Going home for the weekend — parents visiting from out of town',
      status: 'APPROVED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - DAY),
    },
    {
      studentId: alice._id,
      type: 'DAY_OUTING',
      startDate: new Date(now.getTime() + 7 * DAY),
      endDate: new Date(now.getTime() + 7 * DAY),
      reason: 'Internship interview at TCS office',
      status: 'PENDING',
    },
    // Rahul's leaves
    ...(rahul
      ? [
          {
            studentId: rahul._id,
            type: 'OVERNIGHT' as const,
            startDate: new Date(now.getTime() + 2 * DAY),
            endDate: new Date(now.getTime() + 4 * DAY),
            reason: 'Sister\'s engagement ceremony in Jaipur',
            status: 'PENDING',
          },
          {
            studentId: rahul._id,
            type: 'DAY_OUTING' as const,
            startDate: new Date(now.getTime() + 1 * DAY),
            endDate: new Date(now.getTime() + 1 * DAY),
            reason: 'Bank work — need to update KYC documents',
            status: 'PENDING',
          },
        ]
      : []),
    // Priya's leaves
    ...(priya
      ? [
          {
            studentId: priya._id,
            type: 'DAY_OUTING' as const,
            startDate: new Date(now.getTime() + 1 * DAY),
            endDate: new Date(now.getTime() + 1 * DAY),
            reason: 'Dentist appointment — wisdom tooth check-up',
            status: 'PENDING',
          },
        ]
      : []),
    // Arjun's leaves
    ...(arjun
      ? [
          {
            studentId: arjun._id,
            type: 'OVERNIGHT' as const,
            startDate: new Date(now.getTime() + 5 * DAY),
            endDate: new Date(now.getTime() + 7 * DAY),
            reason: 'Campus placement prep — staying at friend\'s place near interview center',
            status: 'PENDING',
          },
          {
            studentId: arjun._id,
            type: 'DAY_OUTING' as const,
            startDate: new Date(now.getTime() - 3 * DAY),
            endDate: new Date(now.getTime() - 3 * DAY),
            reason: 'Collect documents from university registrar',
            status: 'APPROVED',
            approvedBy: warden._id,
            approvedAt: new Date(now.getTime() - 4 * DAY),
          },
        ]
      : []),
    // Sneha's leaves
    ...(sneha
      ? [
          {
            studentId: sneha._id,
            type: 'DAY_OUTING' as const,
            startDate: new Date(now.getTime() + 2 * DAY),
            endDate: new Date(now.getTime() + 2 * DAY),
            reason: 'Photography club field trip to heritage site',
            status: 'PENDING',
          },
        ]
      : []),
    // Vikram's leaves
    ...(vikram
      ? [
          {
            studentId: vikram._id,
            type: 'OVERNIGHT' as const,
            startDate: new Date(now.getTime() + 4 * DAY),
            endDate: new Date(now.getTime() + 6 * DAY),
            reason: 'Attending inter-college cricket tournament in Bangalore',
            status: 'PENDING',
          },
        ]
      : []),
  ];

  await Leave.insertMany(leaves);
  return { created: leaves.length };
}

// ---------------------------------------------------------------------------
// Seed Notices
// ---------------------------------------------------------------------------

async function seedNotices(): Promise<{ created: number }> {
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!warden) return { created: 0 };

  await Notice.deleteMany({ authorId: warden._id });

  const now = new Date();
  const notices = [
    {
      authorId: warden._id,
      title: 'Water Supply Interruption — Block B',
      content: 'Due to maintenance work on the overhead tank, water supply in Block B will be interrupted on Saturday from 10:00 AM to 2:00 PM. Please store water in advance.',
      target: 'BLOCK',
      targetBlock: 'B',
      isActive: true,
      createdAt: new Date(now.getTime() - 2 * DAY),
    },
    {
      authorId: warden._id,
      title: 'Hostel Day Celebration',
      content: 'Annual Hostel Day celebrations will be held on 25th March in the common hall. Cultural performances, food stalls, and games are planned. All residents are welcome to participate.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 1 * DAY),
    },
    {
      authorId: warden._id,
      title: 'Wi-Fi Maintenance Notice',
      content: 'The hostel Wi-Fi network will undergo upgrades tonight between 11:00 PM and 5:00 AM. Expect intermittent connectivity during this window. Ethernet connections will remain unaffected.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 12 * HOUR),
    },
    {
      authorId: warden._id,
      title: 'Room Inspection — All Blocks',
      content: 'Routine room inspection will be conducted next Monday and Tuesday. Please ensure rooms are clean and hostel property is in good condition. Any damages will be charged to occupants.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 6 * HOUR),
    },
    {
      authorId: warden._id,
      title: 'Mess Menu Updated',
      content: 'The mess menu for March has been updated based on the recent feedback survey. New items include paneer tikka on Wednesdays and pasta on Fridays. Check the mess notice board for the full menu.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 3 * HOUR),
    },
    {
      authorId: warden._id,
      title: 'Gate Timings Reminder',
      content: 'All students must return to the hostel by 9:30 PM on weekdays and 10:30 PM on weekends. Late entry will require warden approval and will be recorded in the system.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 5 * DAY),
    },
  ];

  await Notice.insertMany(notices);
  return { created: notices.length };
}

// ---------------------------------------------------------------------------
// Seed Complaints (multi-student, realistic demo data)
// ---------------------------------------------------------------------------

async function seedComplaints(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const arjun = await User.findOne({ email: 'arjun@smarthostel.dev' });
  const sneha = await User.findOne({ email: 'sneha@smarthostel.dev' });
  const vikram = await User.findOne({ email: 'vikram@smarthostel.dev' });
  const maintenance = await User.findOne({ email: 'maintenance@smarthostel.dev' });
  if (!alice || !maintenance) return { created: 0 };

  const studentIds = [alice, rahul, priya, arjun, sneha, vikram].filter(Boolean).map((s) => s!._id);
  await Complaint.deleteMany({ studentId: { $in: studentIds } });

  const now = new Date();
  const complaints = [
    // Alice's complaints
    {
      studentId: alice._id,
      category: 'PLUMBING',
      description: 'Bathroom tap in room B-202 is leaking continuously, wasting water and making the floor slippery',
      status: 'RESOLVED',
      priority: 'HIGH',
      assigneeId: maintenance._id,
      resolutionNotes: 'Replaced the washer and tightened the valve. Tested — no more leaks.',
      dueAt: new Date(now.getTime() - 5 * DAY),
      createdAt: new Date(now.getTime() - 7 * DAY),
      updatedAt: new Date(now.getTime() - 5 * DAY),
    },
    {
      studentId: alice._id,
      category: 'ELECTRICAL',
      description: 'Ceiling fan in room B-202 is making loud grinding noise and wobbling dangerously',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: maintenance._id,
      dueAt: new Date(now.getTime() + 1 * DAY),
      createdAt: new Date(now.getTime() - 2 * DAY),
      updatedAt: new Date(now.getTime() - 1 * DAY),
    },
    {
      studentId: alice._id,
      category: 'INTERNET',
      description: 'Wi-Fi signal is extremely weak on the 2nd floor of Block B. Keeps disconnecting during online classes.',
      status: 'OPEN',
      priority: 'MEDIUM',
      dueAt: new Date(now.getTime() + 3 * DAY),
      createdAt: new Date(now.getTime() - 12 * HOUR),
      updatedAt: new Date(now.getTime() - 12 * HOUR),
    },
    // Rahul's complaints
    ...(rahul
      ? [
          {
            studentId: rahul._id,
            category: 'FURNITURE',
            description: 'Study desk drawer is broken — handle came off and drawer slides are bent. Cannot store books properly.',
            status: 'OPEN',
            priority: 'MEDIUM',
            dueAt: new Date(now.getTime() + 2 * DAY),
            createdAt: new Date(now.getTime() - 1 * DAY),
            updatedAt: new Date(now.getTime() - 1 * DAY),
          },
          {
            studentId: rahul._id,
            category: 'ELECTRICAL',
            description: 'Power socket near bed sparking when plugging in charger. Very dangerous.',
            status: 'ASSIGNED',
            priority: 'CRITICAL',
            assigneeId: maintenance._id,
            dueAt: new Date(now.getTime() + 6 * HOUR),
            createdAt: new Date(now.getTime() - 6 * HOUR),
            updatedAt: new Date(now.getTime() - 4 * HOUR),
          },
        ]
      : []),
    // Priya's complaints
    ...(priya
      ? [
          {
            studentId: priya._id,
            category: 'CLEANING',
            description: 'Common bathroom on 1st floor Block B has not been cleaned for 2 days. Very unhygienic.',
            status: 'RESOLVED',
            priority: 'HIGH',
            assigneeId: maintenance._id,
            resolutionNotes: 'Deep cleaned the bathroom. Cleaning schedule has been updated to prevent recurrence.',
            dueAt: new Date(now.getTime() - 3 * DAY),
            createdAt: new Date(now.getTime() - 4 * DAY),
            updatedAt: new Date(now.getTime() - 3 * DAY),
          },
        ]
      : []),
    // Arjun's complaints
    ...(arjun
      ? [
          {
            studentId: arjun._id,
            category: 'PLUMBING',
            description: 'Toilet flush not working in room A-201 bathroom. Water keeps running after flushing.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            assigneeId: maintenance._id,
            dueAt: new Date(now.getTime() + 12 * HOUR),
            createdAt: new Date(now.getTime() - 1 * DAY),
            updatedAt: new Date(now.getTime() - 8 * HOUR),
          },
        ]
      : []),
    // Sneha's complaints
    ...(sneha
      ? [
          {
            studentId: sneha._id,
            category: 'PEST_CONTROL',
            description: 'Seeing cockroaches frequently in the room, especially near the washbasin area. Need pest control spray.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            assigneeId: maintenance._id,
            dueAt: new Date(now.getTime() + 1 * DAY),
            createdAt: new Date(now.getTime() - 3 * DAY),
            updatedAt: new Date(now.getTime() - 2 * DAY),
          },
        ]
      : []),
    // Vikram's complaints
    ...(vikram
      ? [
          {
            studentId: vikram._id,
            category: 'GENERAL',
            description: 'Water cooler on ground floor Block C is not cooling. Temperature is same as room temperature.',
            status: 'OPEN',
            priority: 'LOW',
            dueAt: new Date(now.getTime() + 4 * DAY),
            createdAt: new Date(now.getTime() - 2 * DAY),
            updatedAt: new Date(now.getTime() - 2 * DAY),
          },
        ]
      : []),
  ];

  await Complaint.insertMany(complaints);
  return { created: complaints.length };
}

// ---------------------------------------------------------------------------
// Seed Notifications
// ---------------------------------------------------------------------------

async function seedNotifications(): Promise<{ created: number }> {
  const student = await User.findOne({ email: 'student@smarthostel.dev' });
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!student || !warden) return { created: 0 };

  await Notification.deleteMany({ recipientId: student._id });

  const now = new Date();
  const recentLeave = await Leave.findOne({ studentId: student._id, status: 'APPROVED' });
  const resolvedComplaint = await Complaint.findOne({ studentId: student._id, status: 'RESOLVED' });
  const latestNotice = await Notice.findOne({ authorId: warden._id }).sort({ createdAt: -1 });

  const notifications = [];

  if (recentLeave) {
    notifications.push({
      recipientId: student._id,
      type: 'LEAVE_APPROVED',
      entityType: 'Leave',
      entityId: recentLeave._id,
      title: 'Leave Approved',
      body: 'Your overnight leave request has been approved by the warden. Remember to scan out at the gate.',
      isRead: false,
      createdAt: new Date(now.getTime() - DAY),
    });
  }

  if (resolvedComplaint) {
    notifications.push({
      recipientId: student._id,
      type: 'COMPLAINT_RESOLVED',
      entityType: 'Complaint',
      entityId: resolvedComplaint._id,
      title: 'Complaint Resolved',
      body: 'Your plumbing complaint has been resolved. Please check and confirm.',
      isRead: true,
      createdAt: new Date(now.getTime() - 5 * DAY),
    });
  }

  if (latestNotice) {
    notifications.push({
      recipientId: student._id,
      type: 'NOTICE_PUBLISHED',
      entityType: 'Notice',
      entityId: latestNotice._id,
      title: 'New Notice',
      body: latestNotice.title,
      isRead: false,
      createdAt: new Date(now.getTime() - 3 * HOUR),
    });
  }

  // Warden notifications
  await Notification.deleteMany({ recipientId: warden._id });
  const openComplaints = await Complaint.find({ status: 'OPEN' }).limit(2);
  for (const c of openComplaints) {
    notifications.push({
      recipientId: warden._id,
      type: 'SLA_REMINDER',
      entityType: 'Complaint',
      entityId: c._id,
      title: 'SLA Deadline Approaching',
      body: `Complaint "${c.category}" needs attention — SLA deadline is approaching.`,
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * HOUR),
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
  return { created: notifications.length };
}

// ---------------------------------------------------------------------------
// Seed Mess Menus
// ---------------------------------------------------------------------------

const messMenuData = [
  {
    dayOfWeek: 0, // Sunday
    breakfast: 'Chole Bhature, Lassi',
    lunch: 'Veg Biryani, Raita, Papad, Gulab Jamun',
    snacks: 'Aloo Tikki, Tea',
    dinner: 'Matar Paneer, Jeera Rice, Roti, Salad',
  },
  {
    dayOfWeek: 1, // Monday
    breakfast: 'Poha, Tea, Banana',
    lunch: 'Dal Tadka, Rice, Roti, Aloo Gobi, Salad',
    snacks: 'Samosa, Tea',
    dinner: 'Paneer Butter Masala, Rice, Roti, Raita',
  },
  {
    dayOfWeek: 2, // Tuesday
    breakfast: 'Idli, Sambhar, Coconut Chutney',
    lunch: 'Rajma, Rice, Roti, Baingan Bharta, Salad',
    snacks: 'Bread Pakora, Tea',
    dinner: 'Chole, Rice, Roti, Onion Salad',
  },
  {
    dayOfWeek: 3, // Wednesday
    breakfast: 'Aloo Paratha, Curd, Pickle',
    lunch: 'Dal Fry, Rice, Roti, Paneer Tikka Masala, Salad',
    snacks: 'Vada Pav, Tea',
    dinner: 'Mix Veg, Rice, Roti, Dal Makhani',
  },
  {
    dayOfWeek: 4, // Thursday
    breakfast: 'Upma, Tea, Sprouts',
    lunch: 'Chana Dal, Rice, Roti, Bhindi Masala, Salad',
    snacks: 'Pav Bhaji, Tea',
    dinner: 'Kadai Paneer, Rice, Roti, Raita',
  },
  {
    dayOfWeek: 5, // Friday
    breakfast: 'Dosa, Sambhar, Chutney',
    lunch: 'Dal Palak, Rice, Roti, Aloo Matar, Salad',
    snacks: 'Pasta, Juice',
    dinner: 'Shahi Paneer, Rice, Roti, Salad',
  },
  {
    dayOfWeek: 6, // Saturday
    breakfast: 'Puri, Aloo Sabzi, Tea',
    lunch: 'Kadhi Pakora, Rice, Roti, Sev Tamatar, Salad',
    snacks: 'Dhokla, Tea',
    dinner: 'Malai Kofta, Rice, Roti, Raita, Ice Cream',
  },
];

async function seedMessMenus(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const menu of messMenuData) {
    const result = await MessMenu.findOneAndUpdate(
      { dayOfWeek: menu.dayOfWeek },
      {
        $set: {
          breakfast: menu.breakfast,
          lunch: menu.lunch,
          snacks: menu.snacks,
          dinner: menu.dinner,
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
// Seed Visitors
// ---------------------------------------------------------------------------

async function seedVisitors(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!alice || !warden) return { created: 0 };

  const studentIds = [alice, rahul, priya].filter(Boolean).map((s) => s!._id);
  await Visitor.deleteMany({ studentId: { $in: studentIds } });

  const now = new Date();
  const visitors = [
    // Alice's visitors
    {
      studentId: alice._id,
      visitorName: 'Meera Student',
      visitorPhone: '9876543210',
      relationship: 'Parent',
      purpose: 'Monthly visit to check on hostel accommodation and bring home-cooked food',
      expectedDate: new Date(now.getTime() + 2 * DAY),
      expectedTime: '10:00 AM - 12:00 PM',
      status: 'APPROVED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 6 * HOUR),
    },
    {
      studentId: alice._id,
      visitorName: 'Rohan Kumar',
      visitorPhone: '9123456789',
      relationship: 'Friend',
      purpose: 'Returning borrowed textbooks and study materials',
      expectedDate: new Date(now.getTime() + 5 * DAY),
      expectedTime: '02:00 PM - 04:00 PM',
      status: 'PENDING',
    },
    {
      studentId: alice._id,
      visitorName: 'Dr. Suresh Patel',
      visitorPhone: '9988776655',
      relationship: 'Guardian',
      purpose: 'Meeting with warden regarding fee payment',
      expectedDate: new Date(now.getTime() - 4 * DAY),
      expectedTime: '10:00 AM - 12:00 PM',
      status: 'CHECKED_OUT',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 5 * DAY),
      checkedInAt: new Date(now.getTime() - 4 * DAY + 10 * HOUR),
      checkedOutAt: new Date(now.getTime() - 4 * DAY + 12 * HOUR),
    },
    // Rahul's visitors
    ...(rahul
      ? [
          {
            studentId: rahul._id,
            visitorName: 'Amit Sharma',
            visitorPhone: '9876501234',
            relationship: 'Parent',
            purpose: 'Dropping off winter clothing and medicines',
            expectedDate: new Date(now.getTime() + 1 * DAY),
            expectedTime: '04:00 PM - 06:00 PM',
            status: 'PENDING',
          },
        ]
      : []),
    // Priya's visitors
    ...(priya
      ? [
          {
            studentId: priya._id,
            visitorName: 'Kavita Patel',
            visitorPhone: '9654321098',
            relationship: 'Sibling',
            purpose: 'Birthday celebration — bringing cake and snacks',
            expectedDate: new Date(now.getTime() + 3 * DAY),
            expectedTime: '12:00 PM - 02:00 PM',
            status: 'PENDING',
          },
        ]
      : []),
  ];

  await Visitor.insertMany(visitors);
  return { created: visitors.length };
}

// ---------------------------------------------------------------------------
// Seed Laundry Slots
// ---------------------------------------------------------------------------

async function seedLaundrySlots(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  if (!alice) return { created: 0 };

  // Use UTC midnight so dates align with API queries
  const now = new Date();
  const todayDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const tomorrowDate = new Date(todayDate.getTime() + DAY);
  const dayAfterTomorrow = new Date(todayDate.getTime() + 2 * DAY);
  await LaundrySlot.deleteMany({
    date: { $gte: todayDate, $lt: dayAfterTomorrow },
  });

  const slots: Array<{
    machineNumber: number;
    date: Date;
    timeSlot: string;
    bookedBy: mongoose.Types.ObjectId | null;
    status: string;
  }> = [];

  // Generate available slots for today and tomorrow (5 machines × 16 time slots)
  for (const date of [todayDate, tomorrowDate]) {
    for (let machine = 1; machine <= 5; machine++) {
      for (let hour = 6; hour < 22; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
        slots.push({
          machineNumber: machine,
          date,
          timeSlot,
          bookedBy: null,
          status: 'AVAILABLE',
        });
      }
    }
  }

  // Book some slots to make it look realistic
  const bookings = [
    // Alice has a booking today
    { machine: 2, hour: 10, day: 0, userId: alice._id },
    // Alice has a booking tomorrow
    { machine: 4, hour: 14, day: 1, userId: alice._id },
    // Rahul's bookings
    ...(rahul ? [{ machine: 1, hour: 8, day: 0, userId: rahul._id }] : []),
    ...(rahul ? [{ machine: 3, hour: 16, day: 1, userId: rahul._id }] : []),
    // Priya's bookings
    ...(priya ? [{ machine: 5, hour: 11, day: 0, userId: priya._id }] : []),
    // Some other "completed" slots from earlier today
    { machine: 1, hour: 6, day: 0, userId: alice._id, status: 'COMPLETED' },
    { machine: 3, hour: 7, day: 0, userId: null, status: 'COMPLETED' },
  ];

  for (const booking of bookings) {
    const timeSlot = `${booking.hour.toString().padStart(2, '0')}:00-${(booking.hour + 1).toString().padStart(2, '0')}:00`;
    const date = booking.day === 0 ? todayDate : tomorrowDate;
    const idx = slots.findIndex(
      (s) => s.machineNumber === booking.machine && s.date === date && s.timeSlot === timeSlot,
    );
    if (idx !== -1) {
      slots[idx].bookedBy = booking.userId;
      slots[idx].status = booking.status ?? 'BOOKED';
    }
  }

  await LaundrySlot.insertMany(slots);
  return { created: slots.length };
}

// ---------------------------------------------------------------------------
// Seed Lost & Found
// ---------------------------------------------------------------------------

async function seedLostFound(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const arjun = await User.findOne({ email: 'arjun@smarthostel.dev' });
  const sneha = await User.findOne({ email: 'sneha@smarthostel.dev' });
  if (!alice) return { created: 0 };

  const studentIds = [alice, rahul, priya, arjun, sneha].filter(Boolean).map((s) => s!._id);
  await LostFound.deleteMany({ postedBy: { $in: studentIds } });

  const now = new Date();
  const items = [
    {
      postedBy: alice._id,
      type: 'LOST',
      itemName: 'Blue Wireless Earbuds',
      description: 'Lost my Sony WF-C500 earbuds, blue color, in a black charging case. Last had them in the common study room, Block B, 2nd floor.',
      category: 'ELECTRONICS',
      locationFound: 'Block B, 2nd Floor Study Room',
      dateOccurred: new Date(now.getTime() - 2 * DAY),
      status: 'ACTIVE',
      contactInfo: 'Room B-202, or call 9876543210',
    },
    ...(rahul
      ? [
          {
            postedBy: rahul._id,
            type: 'FOUND' as const,
            itemName: 'Student ID Card',
            description: 'Found a student ID card near the mess hall entrance. Name partially visible — starts with "S". Blue lanyard attached.',
            category: 'ID_CARDS' as const,
            locationFound: 'Mess Hall Entrance',
            dateOccurred: new Date(now.getTime() - 1 * DAY),
            status: 'ACTIVE',
            contactInfo: 'Room A-101, Rahul',
          },
        ]
      : []),
    ...(priya
      ? [
          {
            postedBy: priya._id,
            type: 'LOST' as const,
            itemName: 'Black Umbrella',
            description: 'Left my black foldable umbrella in the laundry room yesterday. Has a wooden handle and "PP" initials on the strap.',
            category: 'ACCESSORIES' as const,
            locationFound: 'Laundry Room, Block B',
            dateOccurred: new Date(now.getTime() - 3 * DAY),
            status: 'ACTIVE',
            contactInfo: 'Room B-102, Priya',
          },
        ]
      : []),
    ...(arjun
      ? [
          {
            postedBy: arjun._id,
            type: 'FOUND' as const,
            itemName: 'Engineering Mathematics Textbook',
            description: 'Found a textbook on the bench outside Block A. "Engineering Mathematics Vol 2" by B.S. Grewal. Has some highlighted pages and sticky notes.',
            category: 'BOOKS' as const,
            locationFound: 'Bench outside Block A main entrance',
            dateOccurred: new Date(now.getTime() - 4 * DAY),
            status: 'CLAIMED',
            contactInfo: 'Room A-201, Arjun',
          },
        ]
      : []),
    ...(sneha
      ? [
          {
            postedBy: sneha._id,
            type: 'LOST' as const,
            itemName: 'Room Keys (Set of 2)',
            description: 'Lost my room keys somewhere between the mess hall and Block B. Has a red keychain with a small teddy bear attached.',
            category: 'KEYS' as const,
            locationFound: 'Between Mess Hall and Block B',
            dateOccurred: new Date(now.getTime() - 1 * DAY),
            status: 'ACTIVE',
            contactInfo: 'Room B-301, Sneha — urgent!',
          },
          {
            postedBy: sneha._id,
            type: 'FOUND' as const,
            itemName: 'Grey Hoodie',
            description: 'Found a grey Nike hoodie in the common room, Block B, 3rd floor. Size M, no name tag inside.',
            category: 'CLOTHING' as const,
            locationFound: 'Common Room, Block B, 3rd Floor',
            dateOccurred: new Date(now.getTime() - 5 * DAY),
            status: 'ACTIVE',
            contactInfo: 'Room B-301, Sneha',
          },
        ]
      : []),
  ];

  await LostFound.insertMany(items);
  return { created: items.length };
}

// ---------------------------------------------------------------------------
// Seed Feedback
// ---------------------------------------------------------------------------

async function seedFeedback(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const arjun = await User.findOne({ email: 'arjun@smarthostel.dev' });
  const sneha = await User.findOne({ email: 'sneha@smarthostel.dev' });
  const vikram = await User.findOne({ email: 'vikram@smarthostel.dev' });
  const ananya = await User.findOne({ email: 'ananya@smarthostel.dev' });
  if (!alice) return { created: 0 };

  const studentIds = [alice, rahul, priya, arjun, sneha, vikram, ananya].filter(Boolean).map((s) => s!._id);
  await Feedback.deleteMany({ studentId: { $in: studentIds } });

  const now = new Date();
  const feedbacks = [
    {
      studentId: alice._id,
      category: 'MESS',
      rating: 4,
      comment: 'The new Wednesday paneer tikka is excellent! Great improvement to the menu.',
      isAnonymous: false,
      createdAt: new Date(now.getTime() - 2 * DAY),
    },
    {
      studentId: alice._id,
      category: 'LAUNDRY',
      rating: 3,
      comment: 'Machines are often occupied during peak hours. Would be helpful to have more machines or longer operating hours.',
      isAnonymous: false,
      createdAt: new Date(now.getTime() - 5 * DAY),
    },
    ...(rahul
      ? [
          {
            studentId: rahul._id,
            category: 'ROOMS',
            rating: 2,
            comment: 'The mattresses in Block A are quite old and uncomfortable. They need replacement urgently.',
            isAnonymous: false,
            createdAt: new Date(now.getTime() - 3 * DAY),
          },
          {
            studentId: rahul._id,
            category: 'MAINTENANCE',
            rating: 5,
            comment: 'The maintenance team fixed my electrical issue within hours. Very impressed with the response time.',
            isAnonymous: false,
            createdAt: new Date(now.getTime() - 1 * DAY),
          },
        ]
      : []),
    ...(priya
      ? [
          {
            studentId: priya._id,
            category: 'GENERAL',
            rating: 4,
            comment: 'The new hostel management system is very convenient. Being able to book laundry and register visitors online saves a lot of time.',
            isAnonymous: false,
            createdAt: new Date(now.getTime() - 4 * DAY),
          },
        ]
      : []),
    ...(arjun
      ? [
          {
            studentId: arjun._id,
            category: 'MESS',
            rating: 1,
            comment: 'Found hair in the dal today. Kitchen hygiene needs serious improvement. This is unacceptable.',
            isAnonymous: true,
            createdAt: new Date(now.getTime() - 6 * DAY),
          },
        ]
      : []),
    ...(sneha
      ? [
          {
            studentId: sneha._id,
            category: 'ROOMS',
            rating: 4,
            comment: 'Block B rooms are well-maintained. The cleaning staff does a great job with the common areas.',
            isAnonymous: false,
            createdAt: new Date(now.getTime() - 7 * DAY),
          },
        ]
      : []),
    ...(vikram
      ? [
          {
            studentId: vikram._id,
            category: 'LAUNDRY',
            rating: 2,
            comment: 'Machine 3 in the laundry room keeps stopping mid-cycle. Has been reported multiple times but not fixed yet.',
            isAnonymous: true,
            createdAt: new Date(now.getTime() - 8 * DAY),
          },
        ]
      : []),
    ...(ananya
      ? [
          {
            studentId: ananya._id,
            category: 'MAINTENANCE',
            rating: 3,
            comment: 'Plumbing repair was done well but it took 4 days to get someone assigned. Response time could be better.',
            isAnonymous: false,
            createdAt: new Date(now.getTime() - 2 * DAY),
          },
        ]
      : []),
  ];

  await Feedback.insertMany(feedbacks);
  return { created: feedbacks.length };
}

// ---------------------------------------------------------------------------
// Seed Chat Messages
// ---------------------------------------------------------------------------

async function seedChatMessages(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const sneha = await User.findOne({ email: 'sneha@smarthostel.dev' });
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!alice || !warden) return { created: 0 };

  const participants = [alice, rahul, priya, sneha, warden].filter(Boolean).map((u) => u!._id);
  await ChatMessage.deleteMany({
    $or: [{ senderId: { $in: participants } }, { receiverId: { $in: participants } }],
  });

  const now = new Date();
  const messages = [
    // Alice <-> Warden conversation
    {
      senderId: alice._id,
      receiverId: warden._id,
      message: 'Good morning sir. I wanted to ask about the room change request I submitted last week.',
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * DAY - 4 * HOUR),
    },
    {
      senderId: warden._id,
      receiverId: alice._id,
      message: 'Hi Alice. Your request is under review. We are checking room availability in the preferred block.',
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * DAY - 3 * HOUR),
    },
    {
      senderId: alice._id,
      receiverId: warden._id,
      message: 'Thank you sir. Is there an estimated timeline?',
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * DAY - 2 * HOUR),
    },
    {
      senderId: warden._id,
      receiverId: alice._id,
      message: 'Should be processed by end of this week. You will get a notification once approved.',
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * DAY - 1 * HOUR),
    },
    {
      senderId: alice._id,
      receiverId: warden._id,
      message: 'Also, the ceiling fan complaint I raised — it is still making that grinding noise. Could you prioritize it?',
      isRead: false,
      createdAt: new Date(now.getTime() - 6 * HOUR),
    },
    // Alice <-> Rahul conversation (student-student)
    ...(rahul
      ? [
          {
            senderId: rahul._id,
            receiverId: alice._id,
            message: 'Hey Alice, are you going to the hostel day celebration tomorrow?',
            isRead: true,
            createdAt: new Date(now.getTime() - 2 * DAY - 5 * HOUR),
          },
          {
            senderId: alice._id,
            receiverId: rahul._id,
            message: 'Yes! I signed up for the singing competition. Are you participating in anything?',
            isRead: true,
            createdAt: new Date(now.getTime() - 2 * DAY - 4 * HOUR),
          },
          {
            senderId: rahul._id,
            receiverId: alice._id,
            message: 'I am in the cricket match. Also, do you have the notes for yesterday\'s DSA lecture? I missed it.',
            isRead: true,
            createdAt: new Date(now.getTime() - 2 * DAY - 3 * HOUR),
          },
          {
            senderId: alice._id,
            receiverId: rahul._id,
            message: 'Sure, I will share them after dinner. Meet me in the study room around 8?',
            isRead: false,
            createdAt: new Date(now.getTime() - 2 * DAY - 2 * HOUR),
          },
        ]
      : []),
    // Priya <-> Warden conversation
    ...(priya
      ? [
          {
            senderId: priya._id,
            receiverId: warden._id,
            message: 'Sir, the common bathroom cleaning issue I reported has been resolved. Thank you for the quick action.',
            isRead: true,
            createdAt: new Date(now.getTime() - 1 * DAY - 6 * HOUR),
          },
          {
            senderId: warden._id,
            receiverId: priya._id,
            message: 'Glad to hear that Priya. We have updated the cleaning schedule to prevent such issues in future.',
            isRead: true,
            createdAt: new Date(now.getTime() - 1 * DAY - 5 * HOUR),
          },
        ]
      : []),
    // Sneha <-> Alice conversation
    ...(sneha
      ? [
          {
            senderId: sneha._id,
            receiverId: alice._id,
            message: 'Alice, did you find your earbuds yet? I saw a lost & found post on the board.',
            isRead: true,
            createdAt: new Date(now.getTime() - 1 * DAY - 3 * HOUR),
          },
          {
            senderId: alice._id,
            receiverId: sneha._id,
            message: 'Not yet :( I posted about it in the app too. If you hear anything, please let me know!',
            isRead: true,
            createdAt: new Date(now.getTime() - 1 * DAY - 2 * HOUR),
          },
          {
            senderId: sneha._id,
            receiverId: alice._id,
            message: 'Will do! Also, want to grab dinner together today? The mess has malai kofta tonight.',
            isRead: false,
            createdAt: new Date(now.getTime() - 4 * HOUR),
          },
        ]
      : []),
    // Rahul <-> Warden
    ...(rahul
      ? [
          {
            senderId: rahul._id,
            receiverId: warden._id,
            message: 'Sir, regarding the sparking power socket in my room — it is still not fixed. This is a serious safety concern.',
            isRead: false,
            createdAt: new Date(now.getTime() - 2 * HOUR),
          },
        ]
      : []),
  ];

  await ChatMessage.insertMany(messages);
  return { created: messages.length };
}

// ---------------------------------------------------------------------------
// Seed Assets
// ---------------------------------------------------------------------------

async function seedAssets(): Promise<{ created: number }> {
  await Asset.deleteMany({
    assetTag: { $regex: /^SEED-/ },
  });

  const now = new Date();
  const assets = [
    {
      name: 'Study Desk',
      assetTag: 'SEED-FUR-001',
      category: 'FURNITURE',
      location: { block: 'A', floor: '1', room: 'A-101' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 365 * DAY),
      warrantyExpiry: new Date(now.getTime() + 365 * DAY),
      lastMaintenanceDate: new Date(now.getTime() - 30 * DAY),
      qrCode: 'QR-SEED-FUR-001',
      notes: null,
    },
    {
      name: 'Wooden Wardrobe',
      assetTag: 'SEED-FUR-002',
      category: 'FURNITURE',
      location: { block: 'B', floor: '2', room: 'B-202' },
      status: 'NEEDS_REPAIR',
      purchaseDate: new Date(now.getTime() - 730 * DAY),
      warrantyExpiry: null,
      lastMaintenanceDate: new Date(now.getTime() - 180 * DAY),
      qrCode: 'QR-SEED-FUR-002',
      notes: 'Door hinge is loose, needs replacement',
    },
    {
      name: 'Ceiling Fan',
      assetTag: 'SEED-ELE-001',
      category: 'ELECTRICAL',
      location: { block: 'A', floor: '2', room: 'A-201' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 500 * DAY),
      warrantyExpiry: new Date(now.getTime() + 230 * DAY),
      lastMaintenanceDate: new Date(now.getTime() - 60 * DAY),
      qrCode: 'QR-SEED-ELE-001',
      notes: null,
    },
    {
      name: 'Ceiling Fan',
      assetTag: 'SEED-ELE-002',
      category: 'ELECTRICAL',
      location: { block: 'B', floor: '2', room: 'B-202' },
      status: 'UNDER_REPAIR',
      purchaseDate: new Date(now.getTime() - 400 * DAY),
      warrantyExpiry: new Date(now.getTime() + 330 * DAY),
      lastMaintenanceDate: null,
      qrCode: 'QR-SEED-ELE-002',
      notes: 'Motor grinding — sent for rewinding',
    },
    {
      name: 'Water Heater (Geyser)',
      assetTag: 'SEED-ELE-003',
      category: 'ELECTRICAL',
      location: { block: 'C', floor: '1', room: 'C-101' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 200 * DAY),
      warrantyExpiry: new Date(now.getTime() + 530 * DAY),
      lastMaintenanceDate: new Date(now.getTime() - 45 * DAY),
      qrCode: 'QR-SEED-ELE-003',
      notes: null,
    },
    {
      name: 'Bathroom Faucet Set',
      assetTag: 'SEED-PLU-001',
      category: 'PLUMBING',
      location: { block: 'A', floor: '1', room: 'A-102' },
      status: 'NEEDS_REPAIR',
      purchaseDate: new Date(now.getTime() - 600 * DAY),
      warrantyExpiry: null,
      lastMaintenanceDate: new Date(now.getTime() - 90 * DAY),
      qrCode: 'QR-SEED-PLU-001',
      notes: 'Slow drip from hot water tap',
    },
    {
      name: 'Flush Valve',
      assetTag: 'SEED-PLU-002',
      category: 'PLUMBING',
      location: { block: 'B', floor: '3', room: 'B-301' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 150 * DAY),
      warrantyExpiry: new Date(now.getTime() + 580 * DAY),
      lastMaintenanceDate: null,
      qrCode: 'QR-SEED-PLU-002',
      notes: null,
    },
    {
      name: 'Wi-Fi Access Point',
      assetTag: 'SEED-IT-001',
      category: 'IT_EQUIPMENT',
      location: { block: 'A', floor: '2', room: 'A-202' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 300 * DAY),
      warrantyExpiry: new Date(now.getTime() + 430 * DAY),
      lastMaintenanceDate: new Date(now.getTime() - 15 * DAY),
      qrCode: 'QR-SEED-IT-001',
      notes: 'Firmware updated to v3.2.1',
    },
    {
      name: 'Wi-Fi Access Point',
      assetTag: 'SEED-IT-002',
      category: 'IT_EQUIPMENT',
      location: { block: 'B', floor: '1', room: 'B-103' },
      status: 'NEEDS_REPAIR',
      purchaseDate: new Date(now.getTime() - 300 * DAY),
      warrantyExpiry: new Date(now.getTime() + 430 * DAY),
      lastMaintenanceDate: new Date(now.getTime() - 10 * DAY),
      qrCode: 'QR-SEED-IT-002',
      notes: 'Weak signal — antenna may be damaged',
    },
    {
      name: 'Network Switch 24-Port',
      assetTag: 'SEED-IT-003',
      category: 'IT_EQUIPMENT',
      location: { block: 'C', floor: '2', room: 'C-201' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 100 * DAY),
      warrantyExpiry: new Date(now.getTime() + 630 * DAY),
      lastMaintenanceDate: null,
      qrCode: 'QR-SEED-IT-003',
      notes: null,
    },
    {
      name: 'Bunk Bed Frame',
      assetTag: 'SEED-FUR-003',
      category: 'FURNITURE',
      location: { block: 'C', floor: '3', room: 'C-301' },
      status: 'UNDER_REPAIR',
      purchaseDate: new Date(now.getTime() - 800 * DAY),
      warrantyExpiry: null,
      lastMaintenanceDate: new Date(now.getTime() - 5 * DAY),
      qrCode: 'QR-SEED-FUR-003',
      notes: 'Welding repair on lower frame joints',
    },
    {
      name: 'Tube Light Fixture',
      assetTag: 'SEED-ELE-004',
      category: 'ELECTRICAL',
      location: { block: 'A', floor: '3', room: 'A-301' },
      status: 'WORKING',
      purchaseDate: new Date(now.getTime() - 250 * DAY),
      warrantyExpiry: new Date(now.getTime() + 480 * DAY),
      lastMaintenanceDate: new Date(now.getTime() - 20 * DAY),
      qrCode: 'QR-SEED-ELE-004',
      notes: null,
    },
  ];

  await Asset.insertMany(assets);
  return { created: assets.length };
}

// ---------------------------------------------------------------------------
// Seed Wellness Checks
// ---------------------------------------------------------------------------

async function seedWellnessChecks(): Promise<{ created: number }> {
  const alice = await User.findOne({ email: 'student@smarthostel.dev' });
  const rahul = await User.findOne({ email: 'rahul@smarthostel.dev' });
  const priya = await User.findOne({ email: 'priya@smarthostel.dev' });
  const arjun = await User.findOne({ email: 'arjun@smarthostel.dev' });
  const sneha = await User.findOne({ email: 'sneha@smarthostel.dev' });
  const vikram = await User.findOne({ email: 'vikram@smarthostel.dev' });
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!alice || !warden) return { created: 0 };

  const studentIds = [alice, rahul, priya, arjun, sneha, vikram].filter(Boolean).map((s) => s!._id);
  await WellnessCheck.deleteMany({ studentId: { $in: studentIds } });

  const now = new Date();
  const checks = [
    {
      studentId: alice._id,
      checkedBy: warden._id,
      moodScore: 7,
      stressLevel: 'MODERATE',
      notes: 'Seems a bit stressed about upcoming exams but overall in good spirits.',
      flags: ['academic_stress'],
      followUpRequired: false,
      followUpDate: null,
      createdAt: new Date(now.getTime() - 5 * DAY),
    },
    {
      studentId: alice._id,
      checkedBy: warden._id,
      moodScore: 8,
      stressLevel: 'LOW',
      notes: 'Doing well after the exam period. Engaged in hostel activities.',
      flags: [],
      followUpRequired: false,
      followUpDate: null,
      createdAt: new Date(now.getTime() - 1 * DAY),
    },
    ...(rahul
      ? [
          {
            studentId: rahul._id,
            checkedBy: warden._id,
            moodScore: 4,
            stressLevel: 'HIGH' as const,
            notes: 'Reported feeling isolated. Not attending meals regularly. Roommate mentioned he stays in bed most of the day.',
            flags: ['isolation', 'appetite_change'],
            followUpRequired: true,
            followUpDate: new Date(now.getTime() + 3 * DAY),
            createdAt: new Date(now.getTime() - 2 * DAY),
          },
        ]
      : []),
    ...(priya
      ? [
          {
            studentId: priya._id,
            checkedBy: warden._id,
            moodScore: 6,
            stressLevel: 'MODERATE' as const,
            notes: 'Adjusting to hostel life as a first-year student. Homesick but managing well with peer support.',
            flags: ['homesickness'],
            followUpRequired: false,
            followUpDate: null,
            createdAt: new Date(now.getTime() - 4 * DAY),
          },
        ]
      : []),
    ...(arjun
      ? [
          {
            studentId: arjun._id,
            checkedBy: warden._id,
            moodScore: 3,
            stressLevel: 'CRITICAL' as const,
            notes: 'Extremely anxious about campus placements. Sleeping very poorly. Recommended counselor visit.',
            flags: ['academic_stress', 'sleep_issues', 'anxiety'],
            followUpRequired: true,
            followUpDate: new Date(now.getTime() + 2 * DAY),
            createdAt: new Date(now.getTime() - 1 * DAY),
          },
        ]
      : []),
    ...(sneha
      ? [
          {
            studentId: sneha._id,
            checkedBy: warden._id,
            moodScore: 9,
            stressLevel: 'LOW' as const,
            notes: 'Very positive outlook. Active in photography club and maintaining good academic performance.',
            flags: [],
            followUpRequired: false,
            followUpDate: null,
            createdAt: new Date(now.getTime() - 3 * DAY),
          },
        ]
      : []),
    ...(vikram
      ? [
          {
            studentId: vikram._id,
            checkedBy: warden._id,
            moodScore: 5,
            stressLevel: 'HIGH' as const,
            notes: 'Strained relationship with roommates. Prefers to spend time alone. Mentioned feeling unsupported.',
            flags: ['isolation', 'peer_conflict'],
            followUpRequired: true,
            followUpDate: new Date(now.getTime() + 5 * DAY),
            createdAt: new Date(now.getTime() - 2 * DAY),
          },
        ]
      : []),
  ];

  await WellnessCheck.insertMany(checks);
  return { created: checks.length };
}

// ---------------------------------------------------------------------------
// Seed Emergency Alerts
// ---------------------------------------------------------------------------

async function seedEmergencyAlerts(): Promise<{ created: number }> {
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!warden) return { created: 0 };

  await EmergencyAlert.deleteMany({ createdBy: warden._id });

  const now = new Date();
  const alerts = [
    {
      type: 'FIRE',
      severity: 'HIGH',
      title: 'Fire Drill — Block A',
      description: 'Scheduled fire drill for Block A residents. All students must evacuate to the assembly point within 5 minutes. This is a drill — do not panic.',
      targetScope: 'BLOCK',
      targetValue: 'A',
      createdBy: warden._id,
      status: 'RESOLVED',
      resolvedAt: new Date(now.getTime() - 10 * DAY + 2 * HOUR),
      resolvedBy: warden._id,
      createdAt: new Date(now.getTime() - 10 * DAY),
    },
    {
      type: 'MEDICAL',
      severity: 'MEDIUM',
      title: 'Water Contamination Advisory',
      description: 'Water supply in Block B may be contaminated due to pipeline work. Do not drink tap water until further notice. Bottled water is available at the common room.',
      targetScope: 'BLOCK',
      targetValue: 'B',
      createdBy: warden._id,
      status: 'RESOLVED',
      resolvedAt: new Date(now.getTime() - 3 * DAY),
      resolvedBy: warden._id,
      createdAt: new Date(now.getTime() - 4 * DAY),
    },
    {
      type: 'SECURITY',
      severity: 'CRITICAL',
      title: 'Unauthorized Person Spotted Near Block C',
      description: 'Security has reported an unidentified individual near Block C rear entrance. All students should remain in their rooms and keep doors locked. Security team is investigating.',
      targetScope: 'ALL',
      targetValue: null,
      createdBy: warden._id,
      status: 'ACTIVE',
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date(now.getTime() - 2 * HOUR),
    },
  ];

  await EmergencyAlert.insertMany(alerts);
  return { created: alerts.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.\n');

  const summary: Record<string, { created: number; updated?: number }> = {};

  console.log('[1/13] Seeding users...');
  summary.users = await seedUsersData();
  console.log(`  All users have password: ${DEV_PASSWORD}\n`);

  console.log('[2/13] Seeding FAQ entries...');
  summary.faqEntries = await seedFaqEntries();
  console.log(`  FAQ entries: ${summary.faqEntries.created} created, ${summary.faqEntries.updated} updated\n`);

  console.log('[3/13] Seeding category defaults...');
  summary.categoryDefaults = await seedCategoryDefaults();
  console.log(`  Categories: ${summary.categoryDefaults.created} created, ${summary.categoryDefaults.updated} updated\n`);

  console.log('[4/13] Seeding fee records...');
  summary.feeRecords = await seedFeeRecords();
  console.log(`  Fees: ${summary.feeRecords.created} created, ${summary.feeRecords.updated} updated\n`);

  console.log('[5/13] Seeding rooms...');
  summary.rooms = await seedRooms();
  console.log(`  Rooms: ${summary.rooms.created} created, ${summary.rooms.updated} updated\n`);

  console.log('[6/13] Seeding leaves...');
  summary.leaves = await seedLeaves();
  console.log(`  Leaves: ${summary.leaves.created} created\n`);

  console.log('[7/13] Seeding notices...');
  summary.notices = await seedNotices();
  console.log(`  Notices: ${summary.notices.created} created\n`);

  console.log('[8/13] Seeding complaints...');
  summary.complaints = await seedComplaints();
  console.log(`  Complaints: ${summary.complaints.created} created\n`);

  console.log('[9/13] Seeding notifications...');
  summary.notifications = await seedNotifications();
  console.log(`  Notifications: ${summary.notifications.created} created\n`);

  console.log('[10/13] Seeding mess menus...');
  summary.messMenus = await seedMessMenus();
  console.log(`  Mess menus: ${summary.messMenus.created} created, ${summary.messMenus.updated} updated\n`);

  console.log('[11/13] Seeding visitors...');
  summary.visitors = await seedVisitors();
  console.log(`  Visitors: ${summary.visitors.created} created\n`);

  console.log('[12/13] Seeding laundry slots...');
  summary.laundrySlots = await seedLaundrySlots();
  console.log(`  Laundry slots: ${summary.laundrySlots.created} created\n`);

  console.log('[13/13] Seeding lost & found...');
  summary.lostFound = await seedLostFound();
  console.log(`  Lost & found items: ${summary.lostFound.created} created\n`);

  console.log('=== Seed Summary ===');
  for (const [name, counts] of Object.entries(summary)) {
    const parts = [`${counts.created} created`];
    if (counts.updated !== undefined) parts.push(`${counts.updated} updated`);
    console.log(`  ${name}: ${parts.join(', ')}`);
  }
  console.log('\nSeed complete.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
