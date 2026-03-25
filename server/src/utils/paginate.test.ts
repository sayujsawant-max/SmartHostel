import { describe, it, expect } from 'vitest';
import { parsePagination } from './paginate.js';

describe('parsePagination', () => {
  it('returns undefined for missing params', () => {
    const result = parsePagination({});
    expect(result.page).toBeUndefined();
    expect(result.limit).toBeUndefined();
  });

  it('parses page and limit from query', () => {
    const result = parsePagination({ page: '2', limit: '10' });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('handles string values', () => {
    const result = parsePagination({ page: '5', limit: '50' });
    expect(result.page).toBe(5);
    expect(result.limit).toBe(50);
  });
});
