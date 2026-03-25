import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  EmergencyAlert,
  EmergencyAlertStatus,
  EmergencySeverity,
  EmergencyType,
  EmergencyTargetScope,
} from '@models/emergency-alert.model.js';
import { User } from '@models/user.model.js';
import * as emergencyAlertService from './emergency-alert.service.js';

let wardenId: string;

async function createTestWarden() {
  const user = await User.create({
    name: 'Test Warden',
    email: `warden-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    role: 'WARDEN_ADMIN',
    isActive: true,
    hasConsented: true,
    block: 'A',
    floor: '1',
    roomNumber: 'A-001',
  });
  return user._id.toString();
}

beforeEach(async () => {
  wardenId = await createTestWarden();
});

describe('createAlert', () => {
  it('creates an alert successfully', async () => {
    const alert = await emergencyAlertService.createAlert(
      {
        type: EmergencyType.FIRE,
        severity: EmergencySeverity.CRITICAL,
        title: 'Fire in Block A',
        description: 'Fire detected on floor 3',
        targetScope: EmergencyTargetScope.BLOCK,
        targetValue: 'A',
      },
      wardenId,
    );

    expect(alert).toBeDefined();
    expect(alert._id).toBeDefined();
    expect(alert.type).toBe(EmergencyType.FIRE);
    expect(alert.severity).toBe(EmergencySeverity.CRITICAL);
    expect(alert.title).toBe('Fire in Block A');
    expect(alert.status).toBe(EmergencyAlertStatus.ACTIVE);
    expect(alert.createdBy.toString()).toBe(wardenId);
  });

  it('creates alert with ALL target scope', async () => {
    const alert = await emergencyAlertService.createAlert(
      {
        type: EmergencyType.LOCKDOWN,
        severity: EmergencySeverity.HIGH,
        title: 'Campus Lockdown',
        description: 'Security lockdown in effect',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );

    expect(alert.targetScope).toBe(EmergencyTargetScope.ALL);
    expect(alert.targetValue).toBeNull();
  });
});

describe('getAlerts', () => {
  beforeEach(async () => {
    // Create alerts with different statuses and severities
    await emergencyAlertService.createAlert(
      {
        type: EmergencyType.FIRE,
        severity: EmergencySeverity.CRITICAL,
        title: 'Critical Alert',
        description: 'Critical emergency',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );
    await emergencyAlertService.createAlert(
      {
        type: EmergencyType.MEDICAL,
        severity: EmergencySeverity.LOW,
        title: 'Low Alert',
        description: 'Minor medical issue',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );

    // Create a resolved alert
    const resolvedAlert = await emergencyAlertService.createAlert(
      {
        type: EmergencyType.SECURITY,
        severity: EmergencySeverity.MEDIUM,
        title: 'Resolved Alert',
        description: 'Resolved security issue',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );
    await emergencyAlertService.resolveAlert(resolvedAlert._id.toString(), wardenId);
  });

  it('returns all alerts with default pagination', async () => {
    const result = await emergencyAlertService.getAlerts({});

    expect(result.alerts).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('filters by status', async () => {
    const activeResult = await emergencyAlertService.getAlerts({
      status: EmergencyAlertStatus.ACTIVE,
    });
    expect(activeResult.alerts).toHaveLength(2);

    const resolvedResult = await emergencyAlertService.getAlerts({
      status: EmergencyAlertStatus.RESOLVED,
    });
    expect(resolvedResult.alerts).toHaveLength(1);
  });

  it('filters by severity', async () => {
    const result = await emergencyAlertService.getAlerts({
      severity: EmergencySeverity.CRITICAL,
    });
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].title).toBe('Critical Alert');
  });

  it('paginates correctly', async () => {
    const result = await emergencyAlertService.getAlerts({
      page: 1,
      limit: 2,
    });

    expect(result.alerts).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
  });
});

describe('resolveAlert', () => {
  it('resolves an active alert', async () => {
    const alert = await emergencyAlertService.createAlert(
      {
        type: EmergencyType.FIRE,
        severity: EmergencySeverity.HIGH,
        title: 'Fire Alert',
        description: 'Fire in block B',
        targetScope: EmergencyTargetScope.BLOCK,
        targetValue: 'B',
      },
      wardenId,
    );

    const resolved = await emergencyAlertService.resolveAlert(
      alert._id.toString(),
      wardenId,
    );

    expect(resolved.status).toBe(EmergencyAlertStatus.RESOLVED);
    expect(resolved.resolvedBy!.toString()).toBe(wardenId);
    expect(resolved.resolvedAt).toBeDefined();
  });

  it('throws CONFLICT for already resolved alert', async () => {
    const alert = await emergencyAlertService.createAlert(
      {
        type: EmergencyType.MEDICAL,
        severity: EmergencySeverity.MEDIUM,
        title: 'Medical Alert',
        description: 'Medical issue',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );

    await emergencyAlertService.resolveAlert(alert._id.toString(), wardenId);

    await expect(
      emergencyAlertService.resolveAlert(alert._id.toString(), wardenId),
    ).rejects.toThrow('Alert is not active or does not exist');
  });

  it('throws CONFLICT for non-existent alert', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      emergencyAlertService.resolveAlert(fakeId, wardenId),
    ).rejects.toThrow('Alert is not active or does not exist');
  });
});

describe('getActiveAlerts', () => {
  it('returns only active alerts sorted by severity (CRITICAL first)', async () => {
    await emergencyAlertService.createAlert(
      {
        type: EmergencyType.MEDICAL,
        severity: EmergencySeverity.LOW,
        title: 'Low Alert',
        description: 'Low priority',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );
    await emergencyAlertService.createAlert(
      {
        type: EmergencyType.FIRE,
        severity: EmergencySeverity.CRITICAL,
        title: 'Critical Alert',
        description: 'Critical priority',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );
    await emergencyAlertService.createAlert(
      {
        type: EmergencyType.SECURITY,
        severity: EmergencySeverity.HIGH,
        title: 'High Alert',
        description: 'High priority',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );

    // Create and resolve one
    const resolvedAlert = await emergencyAlertService.createAlert(
      {
        type: EmergencyType.LOCKDOWN,
        severity: EmergencySeverity.CRITICAL,
        title: 'Resolved Critical',
        description: 'Already resolved',
        targetScope: EmergencyTargetScope.ALL,
      },
      wardenId,
    );
    await emergencyAlertService.resolveAlert(resolvedAlert._id.toString(), wardenId);

    const active = await emergencyAlertService.getActiveAlerts();

    expect(active).toHaveLength(3);
    // Should be sorted: CRITICAL, HIGH, LOW
    expect(active[0].severity).toBe(EmergencySeverity.CRITICAL);
    expect(active[1].severity).toBe(EmergencySeverity.HIGH);
    expect(active[2].severity).toBe(EmergencySeverity.LOW);
  });

  it('returns empty array when no active alerts', async () => {
    const active = await emergencyAlertService.getActiveAlerts();
    expect(active).toEqual([]);
  });
});
