import { Room } from '@models/room.model.js';
import { User } from '@models/user.model.js';
import { logger } from '@utils/logger.js';

export interface RoomMatch {
  roomId: string;
  block: string;
  floor: string;
  roomNumber: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
  matchScore: number;
  reasons: string[];
  currentOccupants: { name: string; academicYear?: string }[];
}

interface MatchPreferences {
  preferredBlock?: string;
  preferAC?: boolean;
  preferQuiet?: boolean; // lower floors
  budgetMax?: number;
}

/**
 * AI-powered room matching: scores rooms based on compatibility with the student.
 * Factors: gender match, academic year proximity, occupancy level, budget, block preference.
 */
export async function getSmartMatches(
  studentId: string,
  preferences: MatchPreferences = {},
): Promise<RoomMatch[]> {
  const student = await User.findById(studentId).select('gender academicYear block').lean();
  if (!student) return [];

  const hostelGender = student.gender === 'MALE' ? 'BOYS' : 'GIRLS';

  // Get available rooms (not full)
  const rooms = await Room.find({
    hostelGender,
  }).lean();

  const availableRooms = rooms.filter(r => r.occupiedBeds < r.totalBeds);

  // Get occupants for each room to check compatibility
  const roomScores: RoomMatch[] = [];

  for (const room of availableRooms) {
    let score = 50; // base score
    const reasons: string[] = [];

    // Get current occupants
    const occupants = await User.find({
      block: room.block,
      floor: room.floor,
      roomNumber: room.roomNumber,
      isActive: true,
      _id: { $ne: studentId },
    }).select('name academicYear').lean();

    // 1. Academic Year Match (higher weight)
    if (student.academicYear && occupants.length > 0) {
      const yearMatch = occupants.filter(o => o.academicYear === student.academicYear).length;
      const yearScore = (yearMatch / occupants.length) * 25;
      score += yearScore;
      if (yearMatch > 0) reasons.push(`${yearMatch} same-year student${yearMatch > 1 ? 's' : ''}`);
    }

    // 2. Occupancy sweet spot (not empty, not almost full)
    const occupancyRatio = room.occupiedBeds / room.totalBeds;
    if (occupancyRatio > 0 && occupancyRatio < 0.75) {
      score += 10;
      reasons.push('Good occupancy level');
    } else if (occupancyRatio === 0) {
      reasons.push('Empty room — fresh start');
    }

    // 3. Block preference
    if (preferences.preferredBlock && room.block === preferences.preferredBlock) {
      score += 15;
      reasons.push('Preferred block');
    }

    // 4. Same block as current (familiarity)
    if (student.block && room.block === student.block) {
      score += 5;
      reasons.push('Same block');
    }

    // 5. AC preference
    if (preferences.preferAC && room.acType === 'AC') {
      score += 10;
      reasons.push('AC room');
    }

    // 6. Budget
    if (preferences.budgetMax && room.feePerSemester <= preferences.budgetMax) {
      score += 10;
      reasons.push('Within budget');
    } else if (preferences.budgetMax && room.feePerSemester > preferences.budgetMax) {
      score -= 15;
      reasons.push('Over budget');
    }

    // 7. Quiet preference (lower floors)
    if (preferences.preferQuiet) {
      const floorNum = parseInt(room.floor, 10);
      if (!isNaN(floorNum) && floorNum <= 2) {
        score += 8;
        reasons.push('Lower floor (quieter)');
      }
    }

    // 8. Availability bonus (more empty beds = easier to move in)
    const emptyBeds = room.totalBeds - room.occupiedBeds;
    if (emptyBeds >= 2) {
      score += 5;
      reasons.push(`${emptyBeds} beds available`);
    }

    roomScores.push({
      roomId: (room as unknown as { _id: string })._id.toString(),
      block: room.block,
      floor: room.floor,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      acType: room.acType,
      totalBeds: room.totalBeds,
      occupiedBeds: room.occupiedBeds,
      feePerSemester: room.feePerSemester,
      matchScore: Math.min(100, Math.max(0, Math.round(score))),
      reasons,
      currentOccupants: occupants.map(o => ({ name: o.name, academicYear: o.academicYear })),
    });
  }

  // Sort by score descending
  roomScores.sort((a, b) => b.matchScore - a.matchScore);

  logger.info({ studentId, matchCount: roomScores.length }, 'Room matching completed');

  return roomScores.slice(0, 10); // Top 10 matches
}
