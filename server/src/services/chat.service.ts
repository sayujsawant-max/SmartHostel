import mongoose from 'mongoose';
import { ChatMessage } from '@models/chat-message.model.js';
import { AppError } from '@utils/app-error.js';
import { logger } from '@utils/logger.js';

export async function sendMessage(senderId: string, receiverId: string, message: string) {
  if (senderId === receiverId) {
    throw new AppError('VALIDATION_ERROR', 'Cannot send a message to yourself', 400);
  }

  const chatMessage = await ChatMessage.create({
    senderId,
    receiverId,
    message,
  });

  logger.info({ messageId: chatMessage._id, senderId, receiverId }, 'Chat message sent');

  return chatMessage;
}

export async function getConversations(userId: string) {
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const conversations = await ChatMessage.aggregate([
    {
      $match: {
        $or: [{ senderId: objectUserId }, { receiverId: objectUserId }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        partnerId: {
          $cond: {
            if: { $eq: ['$senderId', objectUserId] },
            then: '$receiverId',
            else: '$senderId',
          },
        },
      },
    },
    {
      $group: {
        _id: '$partnerId',
        lastMessage: { $first: '$message' },
        lastMessageAt: { $first: '$createdAt' },
        unreadCount: {
          $sum: {
            $cond: {
              if: {
                $and: [
                  { $eq: ['$receiverId', objectUserId] },
                  { $eq: ['$isRead', false] },
                ],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
    },
    { $sort: { lastMessageAt: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'partner',
      },
    },
    { $unwind: '$partner' },
    {
      $project: {
        partnerId: '$_id',
        partnerName: '$partner.name',
        partnerEmail: '$partner.email',
        lastMessage: 1,
        lastMessageAt: 1,
        unreadCount: 1,
      },
    },
  ]);

  return conversations;
}

export async function getMessages(
  userId: string,
  partnerId: string,
  page?: number,
  limit?: number,
) {
  const p = page ?? 1;
  const l = limit ?? 50;
  const skip = (p - 1) * l;

  const objectUserId = new mongoose.Types.ObjectId(userId);
  const objectPartnerId = new mongoose.Types.ObjectId(partnerId);

  const query = {
    $or: [
      { senderId: objectUserId, receiverId: objectPartnerId },
      { senderId: objectPartnerId, receiverId: objectUserId },
    ],
  };

  const [messages, total] = await Promise.all([
    ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    ChatMessage.countDocuments(query),
  ]);

  return {
    messages: messages.reverse(),
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
  };
}

export async function markAsRead(userId: string, partnerId: string) {
  const result = await ChatMessage.updateMany(
    {
      senderId: new mongoose.Types.ObjectId(partnerId),
      receiverId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    },
    { $set: { isRead: true } },
  );

  logger.info({ userId, partnerId, markedCount: result.modifiedCount }, 'Messages marked as read');

  return { markedCount: result.modifiedCount };
}

export async function getUnreadCount(userId: string) {
  const count = await ChatMessage.countDocuments({
    receiverId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });

  return count;
}
