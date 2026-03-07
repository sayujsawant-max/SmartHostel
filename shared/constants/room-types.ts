export const RoomType = {
  DELUXE: 'DELUXE',
  NORMAL: 'NORMAL',
} as const;

export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const RoomAcType = {
  AC: 'AC',
  NON_AC: 'NON_AC',
} as const;

export type RoomAcType = (typeof RoomAcType)[keyof typeof RoomAcType];

export const HostelGender = {
  BOYS: 'BOYS',
  GIRLS: 'GIRLS',
} as const;

export type HostelGender = (typeof HostelGender)[keyof typeof HostelGender];
