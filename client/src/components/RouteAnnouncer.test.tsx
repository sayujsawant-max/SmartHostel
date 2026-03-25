// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RouteAnnouncer from './RouteAnnouncer';

let mockPathname = '/student/status';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname, search: '', hash: '', state: null, key: 'default' }),
}));

vi.mock('motion/react', () => {
  return new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      if (prop === 'motion') return new Proxy({}, { get: (_t, tag) => tag });
      return (props: Record<string, unknown>) => props.children;
    },
  });
});

describe('RouteAnnouncer', () => {
  it('renders an ARIA live region', () => {
    render(<RouteAnnouncer />);
    const announcer = screen.getByRole('status');
    expect(announcer).toBeTruthy();
    expect(announcer.getAttribute('aria-live')).toBe('polite');
  });

  it('announces the current page name', () => {
    mockPathname = '/warden/complaints';
    render(<RouteAnnouncer />);
    const announcer = screen.getByRole('status');
    expect(announcer.textContent).toBe('Navigated to Complaints');
  });

  it('handles hyphenated paths', () => {
    mockPathname = '/student/mess-menu';
    render(<RouteAnnouncer />);
    const announcer = screen.getByRole('status');
    expect(announcer.textContent).toBe('Navigated to Mess Menu');
  });
});
