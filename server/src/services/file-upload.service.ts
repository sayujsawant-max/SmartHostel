import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@utils/logger.js';

// Configure Cloudinary from environment
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

if (CLOUDINARY_URL) {
  // CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  cloudinary.config({ url: CLOUDINARY_URL });
  logger.info('Cloudinary configured');
} else {
  logger.warn('CLOUDINARY_URL not set — file uploads to cloud will not work');
}

// Multer with memory storage (for cloudinary upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export function uploadSingle(fieldName: string) {
  return upload.single(fieldName);
}

export function uploadMultiple(fieldName: string, maxCount: number) {
  return upload.array(fieldName, maxCount);
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  if (!CLOUDINARY_URL) {
    logger.warn('Cloudinary not configured — skipping upload');
    throw new Error('Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          logger.error({ error, folder, filename }, 'Cloudinary upload failed');
          reject(error);
        } else if (result) {
          logger.info({ publicId: result.public_id, url: result.secure_url }, 'File uploaded to Cloudinary');
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      },
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string) {
  if (!CLOUDINARY_URL) {
    logger.warn('Cloudinary not configured — skipping delete');
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info({ publicId, result: result.result }, 'File deleted from Cloudinary');
    return result;
  } catch (error) {
    logger.error({ error, publicId }, 'Cloudinary delete failed');
    throw error;
  }
}
