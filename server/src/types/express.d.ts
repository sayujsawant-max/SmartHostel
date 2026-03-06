import 'express-serve-static-core';
import type { Role } from '@smarthostel/shared';

declare module 'express-serve-static-core' {
  interface Request {
    correlationId: string;
    user?: {
      _id: string;
      role: Role;
    };
  }
}
