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
// Seed Leaves (demo data)
// ---------------------------------------------------------------------------

async function seedLeaves(): Promise<{ created: number }> {
  const student = await User.findOne({ email: 'student@smarthostel.dev' });
  const warden = await User.findOne({ email: 'warden@smarthostel.dev' });
  if (!student || !warden) return { created: 0 };

  // Clear existing seed leaves
  await Leave.deleteMany({ studentId: student._id });

  const now = new Date();
  const leaves = [
    {
      studentId: student._id,
      type: 'OVERNIGHT',
      startDate: new Date(now.getTime() - 10 * 86_400_000),
      endDate: new Date(now.getTime() - 8 * 86_400_000),
      reason: 'Attending a family wedding in Pune',
      status: 'COMPLETED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 11 * 86_400_000),
    },
    {
      studentId: student._id,
      type: 'DAY_OUTING',
      startDate: new Date(now.getTime() - 5 * 86_400_000),
      endDate: new Date(now.getTime() - 5 * 86_400_000),
      reason: 'Doctor appointment at city hospital',
      status: 'COMPLETED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 6 * 86_400_000),
    },
    {
      studentId: student._id,
      type: 'DAY_OUTING',
      startDate: new Date(now.getTime() - 2 * 86_400_000),
      endDate: new Date(now.getTime() - 2 * 86_400_000),
      reason: 'Shopping for project supplies',
      status: 'REJECTED',
      rejectionReason: 'Too many recent leaves, please wait a week',
    },
    {
      studentId: student._id,
      type: 'OVERNIGHT',
      startDate: new Date(now.getTime() + 3 * 86_400_000),
      endDate: new Date(now.getTime() + 5 * 86_400_000),
      reason: 'Going home for the weekend — parents visiting from out of town',
      status: 'APPROVED',
      approvedBy: warden._id,
      approvedAt: new Date(now.getTime() - 86_400_000),
    },
    {
      studentId: student._id,
      type: 'DAY_OUTING',
      startDate: new Date(now.getTime() + 7 * 86_400_000),
      endDate: new Date(now.getTime() + 7 * 86_400_000),
      reason: 'Internship interview at TCS office',
      status: 'PENDING',
    },
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
      title: 'Water Supply Interruption — Block A',
      content: 'Due to maintenance work on the overhead tank, water supply in Block A will be interrupted on Saturday from 10:00 AM to 2:00 PM. Please store water in advance.',
      target: 'BLOCK',
      targetBlock: 'A',
      isActive: true,
      createdAt: new Date(now.getTime() - 2 * 86_400_000),
    },
    {
      authorId: warden._id,
      title: 'Hostel Day Celebration',
      content: 'Annual Hostel Day celebrations will be held on 15th March in the common hall. Cultural performances, food stalls, and games are planned. All residents are welcome to participate.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 1 * 86_400_000),
    },
    {
      authorId: warden._id,
      title: 'Wi-Fi Maintenance Notice',
      content: 'The hostel Wi-Fi network will undergo upgrades tonight between 11:00 PM and 5:00 AM. Expect intermittent connectivity during this window. Ethernet connections will remain unaffected.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 12 * 3_600_000),
    },
    {
      authorId: warden._id,
      title: 'Room Inspection — All Blocks',
      content: 'Routine room inspection will be conducted next Monday and Tuesday. Please ensure rooms are clean and hostel property is in good condition. Any damages will be charged to occupants.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 6 * 3_600_000),
    },
    {
      authorId: warden._id,
      title: 'Mess Menu Updated',
      content: 'The mess menu for March has been updated based on the recent feedback survey. New items include paneer tikka on Wednesdays and pasta on Fridays. Check the mess notice board for the full menu.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 3 * 3_600_000),
    },
    {
      authorId: warden._id,
      title: 'Gate Timings Reminder',
      content: 'All students must return to the hostel by 9:30 PM on weekdays and 10:30 PM on weekends. Late entry will require warden approval and will be recorded in the system.',
      target: 'ALL',
      isActive: true,
      createdAt: new Date(now.getTime() - 5 * 86_400_000),
    },
  ];

  await Notice.insertMany(notices);
  return { created: notices.length };
}

// ---------------------------------------------------------------------------
// Seed Complaints (realistic demo data)
// ---------------------------------------------------------------------------

async function seedComplaints(): Promise<{ created: number }> {
  const student = await User.findOne({ email: 'student@smarthostel.dev' });
  const maintenance = await User.findOne({ email: 'maintenance@smarthostel.dev' });
  if (!student || !maintenance) return { created: 0 };

  await Complaint.deleteMany({ studentId: student._id });

  const now = new Date();
  const complaints = [
    {
      studentId: student._id,
      category: 'PLUMBING',
      description: 'Bathroom tap in room A-201 is leaking continuously, wasting water and making the floor slippery',
      status: 'RESOLVED',
      priority: 'HIGH',
      assigneeId: maintenance._id,
      resolutionNotes: 'Replaced the washer and tightened the valve. Tested — no more leaks.',
      dueAt: new Date(now.getTime() - 5 * 86_400_000),
      createdAt: new Date(now.getTime() - 7 * 86_400_000),
      updatedAt: new Date(now.getTime() - 5 * 86_400_000),
    },
    {
      studentId: student._id,
      category: 'ELECTRICAL',
      description: 'Ceiling fan in room A-201 is making loud grinding noise and wobbling dangerously',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: maintenance._id,
      dueAt: new Date(now.getTime() + 1 * 86_400_000),
      createdAt: new Date(now.getTime() - 2 * 86_400_000),
      updatedAt: new Date(now.getTime() - 1 * 86_400_000),
    },
    {
      studentId: student._id,
      category: 'FURNITURE',
      description: 'Study desk drawer is broken — handle came off and drawer slides are bent. Cannot store books properly.',
      status: 'OPEN',
      priority: 'MEDIUM',
      dueAt: new Date(now.getTime() + 2 * 86_400_000),
      createdAt: new Date(now.getTime() - 1 * 86_400_000),
      updatedAt: new Date(now.getTime() - 1 * 86_400_000),
    },
    {
      studentId: student._id,
      category: 'INTERNET',
      description: 'Wi-Fi signal is extremely weak on the 3rd floor of Block A. Keeps disconnecting during online classes.',
      status: 'OPEN',
      priority: 'MEDIUM',
      dueAt: new Date(now.getTime() + 3 * 86_400_000),
      createdAt: new Date(now.getTime() - 12 * 3_600_000),
      updatedAt: new Date(now.getTime() - 12 * 3_600_000),
    },
    {
      studentId: student._id,
      category: 'CLEANING',
      description: 'Common bathroom on 2nd floor Block A has not been cleaned for 2 days. Very unhygienic.',
      status: 'RESOLVED',
      priority: 'HIGH',
      assigneeId: maintenance._id,
      resolutionNotes: 'Deep cleaned the bathroom. Cleaning schedule has been updated to prevent recurrence.',
      dueAt: new Date(now.getTime() - 3 * 86_400_000),
      createdAt: new Date(now.getTime() - 4 * 86_400_000),
      updatedAt: new Date(now.getTime() - 3 * 86_400_000),
    },
    {
      studentId: student._id,
      category: 'PEST_CONTROL',
      description: 'Seeing cockroaches frequently in the room, especially near the washbasin area. Need pest control spray.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: maintenance._id,
      dueAt: new Date(now.getTime() + 1 * 86_400_000),
      createdAt: new Date(now.getTime() - 3 * 86_400_000),
      updatedAt: new Date(now.getTime() - 2 * 86_400_000),
    },
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
      createdAt: new Date(now.getTime() - 86_400_000),
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
      createdAt: new Date(now.getTime() - 5 * 86_400_000),
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
      createdAt: new Date(now.getTime() - 3 * 3_600_000),
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
      createdAt: new Date(now.getTime() - 2 * 3_600_000),
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
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.\n');

  const summary: Record<string, { created: number; updated?: number }> = {};

  console.log('[1/10] Seeding users...');
  summary.users = await seedUsersData();
  console.log(`  All users have password: ${DEV_PASSWORD}\n`);

  console.log('[2/10] Seeding FAQ entries...');
  summary.faqEntries = await seedFaqEntries();
  console.log(`  FAQ entries: ${summary.faqEntries.created} created, ${summary.faqEntries.updated} updated\n`);

  console.log('[3/10] Seeding category defaults...');
  summary.categoryDefaults = await seedCategoryDefaults();
  console.log(`  Categories: ${summary.categoryDefaults.created} created, ${summary.categoryDefaults.updated} updated\n`);

  console.log('[4/10] Seeding fee records...');
  summary.feeRecords = await seedFeeRecords();
  console.log(`  Fees: ${summary.feeRecords.created} created, ${summary.feeRecords.updated} updated\n`);

  console.log('[5/10] Seeding rooms...');
  summary.rooms = await seedRooms();
  console.log(`  Rooms: ${summary.rooms.created} created, ${summary.rooms.updated} updated\n`);

  console.log('[6/10] Seeding leaves...');
  summary.leaves = await seedLeaves();
  console.log(`  Leaves: ${summary.leaves.created} created\n`);

  console.log('[7/10] Seeding notices...');
  summary.notices = await seedNotices();
  console.log(`  Notices: ${summary.notices.created} created\n`);

  console.log('[8/10] Seeding complaints...');
  summary.complaints = await seedComplaints();
  console.log(`  Complaints: ${summary.complaints.created} created\n`);

  console.log('[9/10] Seeding notifications...');
  summary.notifications = await seedNotifications();
  console.log(`  Notifications: ${summary.notifications.created} created\n`);

  console.log('[10/10] Seeding mess menus...');
  summary.messMenus = await seedMessMenus();
  console.log(`  Mess menus: ${summary.messMenus.created} created, ${summary.messMenus.updated} updated\n`);

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
