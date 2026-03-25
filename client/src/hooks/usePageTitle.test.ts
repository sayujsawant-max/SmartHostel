// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { usePageTitle } from './usePageTitle';

describe('usePageTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document.title with app name suffix', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Dashboard | SmartHostel');
  });

  it('restores previous title on unmount', () => {
    document.title = 'Original';
    const { unmount } = renderHook(() => usePageTitle('Settings'));
    expect(document.title).toBe('Settings | SmartHostel');
    unmount();
    expect(document.title).toBe('Original');
  });

  it('updates title when title prop changes', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'Page A' },
    });
    expect(document.title).toBe('Page A | SmartHostel');

    rerender({ title: 'Page B' });
    expect(document.title).toBe('Page B | SmartHostel');
  });
});
