import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '@config/env.js';
import { logger } from '@utils/logger.js';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const origins = env.ALLOWED_ORIGINS.split(',').map(s => s.trim());

  io = new SocketIOServer(httpServer, {
    cors: { origin: origins, credentials: true },
    path: '/ws',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;

    if (userId) {
      void socket.join(`user:${userId}`);
      logger.info({ userId, socketId: socket.id }, 'WS client connected');
    }

    socket.on('join-role', (role: string) => {
      void socket.join(`role:${role}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ userId, socketId: socket.id }, 'WS client disconnected');
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

/** Send a real-time notification to a specific user */
export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/** Send to all users with a specific role */
export function emitToRole(role: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
}

/** Broadcast to all connected clients */
export function emitToAll(event: string, data: unknown) {
  if (!io) return;
  io.emit(event, data);
}
