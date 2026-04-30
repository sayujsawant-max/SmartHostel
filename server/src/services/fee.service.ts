import { Types } from 'mongoose';
import { Fee, type IFee } from '@models/fee.model.js';
import { User } from '@models/user.model.js';
import { AppError } from '@utils/app-error.js';

export interface IssueFeeInput {
  studentId: string;
  feeType: 'HOSTEL_FEE' | 'MESS_FEE' | 'MAINTENANCE_FEE';
  amount: number;
  currency?: string;
  dueDate: string | Date;
  semester: string;
  academicYear: string;
}

export async function listStudents() {
  return User.find({ role: 'STUDENT' })
    .select('name email roomNumber block')
    .sort({ name: 1 })
    .lean();
}

export async function listFees(filter: { status?: string; feeType?: string }) {
  const q: Record<string, unknown> = {};
  if (filter.status) q.status = filter.status;
  if (filter.feeType) q.feeType = filter.feeType;
  return Fee.find(q)
    .sort({ createdAt: -1 })
    .populate<{ studentId: { _id: Types.ObjectId; name: string; email: string; roomNumber?: string; block?: string } | null }>(
      'studentId',
      'name email roomNumber block',
    )
    .lean();
}

export async function issueFee(input: IssueFeeInput): Promise<IFee> {
  if (!Types.ObjectId.isValid(input.studentId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid student id', 400);
  }
  const student = await User.findOne({ _id: input.studentId, role: 'STUDENT' });
  if (!student) throw new AppError('NOT_FOUND', 'Student not found', 404);

  const due = new Date(input.dueDate);
  if (Number.isNaN(due.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'Invalid dueDate', 400);
  }

  const status = due < new Date() ? 'OVERDUE' : 'UNPAID';

  return Fee.create({
    studentId: student._id,
    feeType: input.feeType,
    amount: input.amount,
    currency: input.currency ?? 'INR',
    dueDate: due,
    status,
    semester: input.semester,
    academicYear: input.academicYear,
  });
}

export async function issueFeesToAll(input: Omit<IssueFeeInput, 'studentId'>): Promise<number> {
  const due = new Date(input.dueDate);
  if (Number.isNaN(due.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'Invalid dueDate', 400);
  }
  const status = due < new Date() ? 'OVERDUE' : 'UNPAID';

  const students = await User.find({ role: 'STUDENT' }).select('_id').lean();
  if (students.length === 0) return 0;

  const docs = students.map((s) => ({
    studentId: s._id,
    feeType: input.feeType,
    amount: input.amount,
    currency: input.currency ?? 'INR',
    dueDate: due,
    status,
    semester: input.semester,
    academicYear: input.academicYear,
  }));
  const inserted = await Fee.insertMany(docs);
  return inserted.length;
}

export async function deleteFee(feeId: string): Promise<void> {
  if (!Types.ObjectId.isValid(feeId)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid fee id', 400);
  }
  const fee = await Fee.findById(feeId);
  if (!fee) throw new AppError('NOT_FOUND', 'Fee not found', 404);
  if (fee.status === 'PAID') {
    throw new AppError('VALIDATION_ERROR', 'Cannot delete a paid fee', 400);
  }
  await Fee.deleteOne({ _id: fee._id });
}
