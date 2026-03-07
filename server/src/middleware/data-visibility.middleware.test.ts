import { describe, it, expect } from 'vitest';
import { buildVisibilityFilter, scopeQuery } from '@middleware/data-visibility.middleware.js';

describe('buildVisibilityFilter', () => {
  describe('resource: ownedByStudent', () => {
    it('returns { studentId } filter for STUDENT role (AC-3)', () => {
      const filter = buildVisibilityFilter(
        { _id: 'student-123', role: 'STUDENT' },
        'ownedByStudent',
      );
      expect(filter).toEqual({ studentId: 'student-123' });
    });

    it('returns empty filter for WARDEN_ADMIN role (AC-4)', () => {
      const filter = buildVisibilityFilter(
        { _id: 'warden-1', role: 'WARDEN_ADMIN' },
        'ownedByStudent',
      );
      expect(filter).toEqual({});
    });

    it('throws FORBIDDEN for GUARD role', () => {
      expect(() =>
        buildVisibilityFilter({ _id: 'guard-1', role: 'GUARD' }, 'ownedByStudent'),
      ).toThrow();

      try {
        buildVisibilityFilter({ _id: 'guard-1', role: 'GUARD' }, 'ownedByStudent');
      } catch (err: unknown) {
        expect((err as Record<string, unknown>).statusCode).toBe(403);
        expect((err as Record<string, unknown>).code).toBe('FORBIDDEN');
      }
    });

    it('throws FORBIDDEN for MAINTENANCE role', () => {
      expect(() =>
        buildVisibilityFilter({ _id: 'm-1', role: 'MAINTENANCE' }, 'ownedByStudent'),
      ).toThrow();
    });
  });

  describe('resource: assignedToMaintenance', () => {
    it('returns { assignedTo } filter for MAINTENANCE role (AC-5)', () => {
      const filter = buildVisibilityFilter(
        { _id: 'maint-42', role: 'MAINTENANCE' },
        'assignedToMaintenance',
      );
      expect(filter).toEqual({ assignedTo: 'maint-42' });
    });

    it('returns empty filter for WARDEN_ADMIN role (AC-4)', () => {
      const filter = buildVisibilityFilter(
        { _id: 'warden-1', role: 'WARDEN_ADMIN' },
        'assignedToMaintenance',
      );
      expect(filter).toEqual({});
    });

    it('returns { studentId } filter for STUDENT role (AC-3)', () => {
      const filter = buildVisibilityFilter(
        { _id: 'student-7', role: 'STUDENT' },
        'assignedToMaintenance',
      );
      expect(filter).toEqual({ studentId: 'student-7' });
    });

    it('throws FORBIDDEN for GUARD role (AC-2)', () => {
      expect(() =>
        buildVisibilityFilter({ _id: 'guard-1', role: 'GUARD' }, 'assignedToMaintenance'),
      ).toThrow();

      try {
        buildVisibilityFilter({ _id: 'guard-1', role: 'GUARD' }, 'assignedToMaintenance');
      } catch (err: unknown) {
        expect((err as Record<string, unknown>).statusCode).toBe(403);
        expect((err as Record<string, unknown>).code).toBe('FORBIDDEN');
      }
    });
  });
});

describe('scopeQuery', () => {
  it('merges base query with visibility filter', () => {
    const base = { status: 'OPEN', category: 'PLUMBING' };
    const filter = { assignedTo: 'maint-42' };

    const result = scopeQuery(base, filter);
    expect(result).toEqual({
      status: 'OPEN',
      category: 'PLUMBING',
      assignedTo: 'maint-42',
    });
  });

  it('returns base query unchanged when filter is empty (warden full access)', () => {
    const base = { status: 'OPEN' };
    const filter = {};

    const result = scopeQuery(base, filter);
    expect(result).toEqual({ status: 'OPEN' });
  });

  it('returns only filter when base query is empty', () => {
    const result = scopeQuery({}, { studentId: 's-1' });
    expect(result).toEqual({ studentId: 's-1' });
  });
});
