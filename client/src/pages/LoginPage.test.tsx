// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';
import type { UserProfile } from '@context/auth-context-value';
import { ApiError } from '@services/api';
import { Role } from '@smarthostel/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockLogin = vi.fn();
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('@utils/role-home', () => ({
  getRoleHomePath: (role: string) => `/${role}/home`,
}));

vi.mock('@context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields with sign in button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders links to register and rooms pages', () => {
    render(<LoginPage />);

    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Browse Rooms & Availability')).toBeInTheDocument();
  });

  it('submits form and navigates on successful login', async () => {
    const user = makeUser();
    mockLogin.mockResolvedValueOnce(user);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'ValidPass123!');
      expect(mockNavigate).toHaveBeenCalledWith('/STUDENT/home', { replace: true });
    });
  });

  it('displays server error message on ApiError', async () => {
    const errorResponse = {
      success: false as const,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        retryable: false,
      },
      correlationId: 'test',
    };
    mockLogin.mockRejectedValueOnce(new ApiError(errorResponse, 401));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'WrongPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('displays lockout countdown on rate limit error', async () => {
    const errorResponse = {
      success: false as const,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many attempts',
        retryable: true,
        retryAfterMs: 30000,
      },
      correlationId: 'test',
    };
    mockLogin.mockRejectedValueOnce(new ApiError(errorResponse, 429));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'SomePass123!!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Account temporarily locked due to too many failed attempts.'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Try again in 30 seconds/)).toBeInTheDocument();
    });
  });

  it('displays generic error for non-ApiError exceptions', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network failure'));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'SomePass123!!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    let resolveLogin: (value: UserProfile) => void;
    mockLogin.mockReturnValueOnce(
      new Promise<UserProfile>((resolve) => {
        resolveLogin = resolve;
      }),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find((b) => b.getAttribute('type') === 'submit');
      expect(submitBtn).toBeDisabled();
    });

    resolveLogin!(makeUser());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
