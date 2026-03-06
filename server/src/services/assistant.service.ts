import { FaqEntry } from '@models/faq-entry.model.js';
import { Fee } from '@models/fee.model.js';

export async function getFaqEntries() {
  return FaqEntry.find({ isActive: true })
    .sort({ category: 1, question: 1 })
    .lean();
}

export async function getStudentFees(studentId: string) {
  return Fee.find({ studentId })
    .sort({ dueDate: -1 })
    .lean();
}
