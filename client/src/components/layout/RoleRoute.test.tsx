// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleRoute from './RoleRoute';
import type { AuthContextType, UserProfile } from '@context/auth-context-value';
import { Role } from '@smarthostel/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props);
    return <div data-testid="navigate">Redirecting to {props.to}</div>;
  },
  Outlet: () => <div data-testid="outlet">Role Content</div>,
}));

const mockUseAuth = vi.fn<() => Pick<AuthContextType, 'user'>>();
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@utils/role-home', () => ({
  getRoleHomePath: (role: string) => `/${role}/home`,
}));

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: Role.STUDENT,
    hasConsented: true,
    ...overrides,
  };
}

describe('RoleRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Outlet when user role is allowed', () => {
    mockUseAuth.mockReturnValue({ user: makeUser({ role: Role.STUDENT }) });
    render(<RoleRoute allowedRoles={[Role.STUDENT]} />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects to login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<RoleRoute allowedRoles={[Role.STUDENT]} />);

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login', replace: true }),
    );
  });

  it('redirects to role home when user role is not allowed', () => {
    mockUseAuth.mockReturnValue({ user: makeUser({ role: Role.GUARD }) });
    render(<RoleRoute allowedRoles={[Role.STUDENT]} />);

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/GUARD/home', replace: true }),
    );
  });

  it('allows access when user role is one of multiple allowed roles', () => {
    mockUseAuth.mockReturnValue({ user: makeUser({ role: Role.WARDEN_ADMIN }) });
    render(<RoleRoute allowedRoles={[Role.STUDENT, Role.WARDEN_ADMIN]} />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
