import type { Request, Response } from 'express';
import * as fileUploadService from '@services/file-upload.service.js';
import { AppError } from '@utils/app-error.js';

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError('VALIDATION_ERROR', 'No file provided', 400);
  }

  const folder = 'uploads';
  const filename = `${req.user!._id}-${Date.now()}`;
  const result = await fileUploadService.uploadToCloudinary(req.file.buffer, folder, filename);

  res.status(201).json({
    success: true,
    data: { url: result.url, publicId: result.publicId },
    correlationId: req.correlationId,
  });
}

export async function deleteFile(req: Request<{ publicId: string }>, res: Response) {
  const { publicId } = req.params;
  await fileUploadService.deleteFromCloudinary(publicId);

  res.json({
    success: true,
    data: { message: 'File deleted' },
    correlationId: req.correlationId,
  });
}
