import type { Request, Response } from 'express';
import { createUserSchema, resetPasswordSchema } from '@smarthostel/shared';
import * as adminService from '@services/admin.service.js';
import { AppError } from '@utils/app-error.js';
import { parsePagination } from '@utils/paginate.js';

export async function listUsers(req: Request, res: Response) {
  const result = await adminService.listUsers(parsePagination(req.query));
  res.json({ success: true, data: { users: result.items, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } } });
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid user input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const user = await adminService.createUser(parsed.data, req.correlationId);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        block: user.block,
        floor: user.floor,
        roomNumber: user.roomNumber,
        isActive: user.isActive,
      },
    },
    correlationId: req.correlationId,
  });
}

export async function enableUser(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  await adminService.enableUser(id, req.correlationId);

  res.json({
    success: true,
    data: { message: 'User account enabled' },
    correlationId: req.correlationId,
  });
}

export async function disableUser(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  await adminService.disableUser(id, req.user!._id, req.correlationId);

  res.json({
    success: true,
    data: { message: 'User account disabled' },
    correlationId: req.correlationId,
  });
}

export async function resetPassword(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid password input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  await adminService.resetPassword(id, parsed.data.password, req.correlationId);

  res.json({
    success: true,
    data: { message: 'Password reset successfully' },
    correlationId: req.correlationId,
  });
}
