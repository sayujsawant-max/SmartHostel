import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must define mock functions inside the factory to avoid hoisting issues
vi.mock('@models/notification.model.js', () => {
  const mockFind = vi.fn();
  const mockCountDocuments = vi.fn();
  const mockFindOneAndUpdate = vi.fn();
  const mockUpdateMany = vi.fn();

  return {
    Notification: {
      find: mockFind,
      countDocuments: mockCountDocuments,
      findOneAndUpdate: mockFindOneAndUpdate,
      updateMany: mockUpdateMany,
    },
  };
});

// Import after mock setup
import { Notification } from '@models/notification.model.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notification.service.js';

const mockFind = Notification.find as ReturnType<typeof vi.fn>;
const mockCountDocuments = Notification.countDocuments as ReturnType<typeof vi.fn>;
const mockFindOneAndUpdate = Notification.findOneAndUpdate as ReturnType<typeof vi.fn>;
const mockUpdateMany = Notification.updateMany as ReturnType<typeof vi.fn>;

describe('notification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('returns sorted notifications for a user', async () => {
      const mockNotifications = [
        { _id: 'n1', title: 'New complaint', recipientId: 'user1' },
        { _id: 'n2', title: 'Leave approved', recipientId: 'user1' },
      ];

      const chainMock = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockNotifications),
      };
      mockFind.mockReturnValue(chainMock);

      const result = await getUserNotifications('user1');

      expect(mockFind).toHaveBeenCalledWith({ recipientId: 'user1' });
      expect(chainMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(chainMock.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockNotifications);
    });

    it('uses custom limit when provided', async () => {
      const chainMock = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      mockFind.mockReturnValue(chainMock);

      await getUserNotifications('user1', 10);

      expect(chainMock.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      mockCountDocuments.mockResolvedValue(5);

      const count = await getUnreadCount('user1');

      expect(mockCountDocuments).toHaveBeenCalledWith({
        recipientId: 'user1',
        isRead: false,
      });
      expect(count).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('updates the notification to read', async () => {
      const updatedNotification = { _id: 'n1', recipientId: 'user1', isRead: true };
      mockFindOneAndUpdate.mockResolvedValue(updatedNotification);

      const result = await markAsRead('n1', 'user1');

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'n1', recipientId: 'user1' },
        { isRead: true },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(updatedNotification);
    });

    it('returns null when notification not found', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      const result = await markAsRead('nonexistent', 'user1');
      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('updates multiple unread notifications to read', async () => {
      const updateResult = { modifiedCount: 3, matchedCount: 3 };
      mockUpdateMany.mockResolvedValue(updateResult);

      const result = await markAllAsRead('user1');

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { recipientId: 'user1', isRead: false },
        { isRead: true },
      );
      expect(result).toEqual(updateResult);
    });
  });
});
