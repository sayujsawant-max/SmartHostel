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
export { loginSchema, registerSchema, forgotPasswordSchema, selfResetPasswordSchema, changePasswordSchema, googleAuthSchema, Gender, AcademicYear } from './schemas/auth.schema.js';
export type { LoginInput, RegisterInput, ForgotPasswordInput, SelfResetPasswordInput, ChangePasswordInput } from './schemas/auth.schema.js';
export { createUserSchema, resetPasswordSchema } from './schemas/admin.schema.js';
export type { CreateUserInput, ResetPasswordInput } from './schemas/admin.schema.js';
export { createLeaveSchema } from './schemas/leave.schema.js';
export type { CreateLeaveInput } from './schemas/leave.schema.js';
export { createComplaintSchema } from './schemas/complaint.schema.js';
export type { CreateComplaintInput } from './schemas/complaint.schema.js';
export { createRoomSchema } from './schemas/room.schema.js';
export type { CreateRoomInput } from './schemas/room.schema.js';
export { updateMessMenuSchema, rateMenuSchema } from './schemas/mess-menu.schema.js';
export type { UpdateMessMenuInput, RateMenuInput } from './schemas/mess-menu.schema.js';
export { createNoticeSchema } from './schemas/notice.schema.js';
export type { CreateNoticeInput } from './schemas/notice.schema.js';
export { registerVisitorSchema } from './schemas/visitor.schema.js';
export type { RegisterVisitorInput } from './schemas/visitor.schema.js';
export { createLostFoundSchema } from './schemas/lost-found.schema.js';
export type { CreateLostFoundInput } from './schemas/lost-found.schema.js';
export { createSosSchema } from './schemas/sos.schema.js';
export type { CreateSosInput } from './schemas/sos.schema.js';
export { submitFeedbackSchema } from './schemas/feedback.schema.js';
export type { SubmitFeedbackInput } from './schemas/feedback.schema.js';
export { sendMessageSchema } from './schemas/chat.schema.js';
export type { SendMessageInput } from './schemas/chat.schema.js';
export { createAssetSchema } from './schemas/asset.schema.js';
export type { CreateAssetInput } from './schemas/asset.schema.js';
