// Constants
export { Role } from './constants/roles.js';
export { RoomType, RoomAcType, HostelGender } from './constants/room-types.js';
export { ErrorCode, ERROR_STATUS_MAP } from './constants/error-codes.js';
export { LeaveStatus } from './constants/leave-status.js';
export { LeaveType } from './constants/leave-types.js';
export { NotificationType } from './constants/notification-types.js';
export { GatePassStatus } from './constants/gate-pass-status.js';
export { ScanResult } from './constants/scan-results.js';
export { ComplaintStatus } from './constants/complaint-status.js';
export { ComplaintCategory } from './constants/complaint-category.js';
export { ComplaintPriority } from './constants/complaint-priority.js';
export { SLA_CATEGORY_DEFAULTS, SLA_HOURS_BY_PRIORITY } from './constants/sla-defaults.js';
export type { SlaCategoryDefault } from './constants/sla-defaults.js';

// Types
export type { ApiSuccess, ApiError, PaginatedResponse } from './types/api-responses.js';

// Schemas
export { loginSchema, registerSchema, forgotPasswordSchema, selfResetPasswordSchema, googleAuthSchema, Gender, AcademicYear } from './schemas/auth.schema.js';
export type { LoginInput, RegisterInput, ForgotPasswordInput, SelfResetPasswordInput } from './schemas/auth.schema.js';
export { createUserSchema, resetPasswordSchema } from './schemas/admin.schema.js';
export type { CreateUserInput, ResetPasswordInput } from './schemas/admin.schema.js';
export { createLeaveSchema } from './schemas/leave.schema.js';
export type { CreateLeaveInput } from './schemas/leave.schema.js';
export { createComplaintSchema } from './schemas/complaint.schema.js';
export type { CreateComplaintInput } from './schemas/complaint.schema.js';
export { createRoomSchema } from './schemas/room.schema.js';
export type { CreateRoomInput } from './schemas/room.schema.js';
