// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import type { AuthContextType, UserProfile } from '@context/auth-context-value';

// Track Navigate renders
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props);
    return <div data-testid="navigate">Redirecting to {props.to}</div>;
  },
  Outlet: () => <div data-testid="outlet">Protected Content</div>,
}));

// Mock useAuth — we will override the return value per test
const mockUseAuth = vi.fn<() => AuthContextType>();
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ConsentModal
vi.mock('@components/features/auth/ConsentModal', () => ({
  default: () => <div data-testid="consent-modal">ConsentModal</div>,
}));

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'student' as UserProfile['role'],
    hasConsented: true,
    ...overrides,
  };
}

function authValue(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: makeUser(),
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setConsented: vi.fn(),
    ...overrides,
  };
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Outlet when user is authenticated and has consented', () => {
    mockUseAuth.mockReturnValue(authValue());
    render(<ProtectedRoute />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('consent-modal')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue(
      authValue({ user: null, isAuthenticated: false }),
    );
    render(<ProtectedRoute />);

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/landing', replace: true }),
    );
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
  });

  it('shows ConsentModal when authenticated but hasConsented is false', () => {
    mockUseAuth.mockReturnValue(
      authValue({ user: makeUser({ hasConsented: false }) }),
    );
    render(<ProtectedRoute />);

    expect(screen.getByTestId('consent-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
