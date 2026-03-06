# Story 6.5: In-App Notification System

## Story

As a **user**,
I want to receive in-app notifications for key events and view my notification list,
So that I stay informed about actions that affect me.

## Status: Complete

## Acceptance Criteria

**AC1:** Notification model with type, recipientId, title, body, isRead, TTL index (180 days).

**AC2:** NotificationService with getUserNotifications, getUnreadCount, markAsRead, markAllAsRead.

**AC3:** REST endpoints: GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all.

**AC4:** NotificationBell component with unread badge, dropdown list, 30s polling, mark-read support.

**AC5:** NotificationBell integrated into StudentShell, MaintenanceShell, and WardenShell headers.

## Tasks

### Task 1: Create notification service with CRUD operations
### Task 2: Create notification controller and routes
### Task 3: Mount notification routes in app.ts
### Task 4: Build NotificationBell component with dropdown UI
### Task 5: Add NotificationBell to all role shell layouts
