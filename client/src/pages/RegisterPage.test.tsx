// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from './RegisterPage';
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

const mockRegister = vi.fn();
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

vi.mock('@utils/role-home', () => ({
  getRoleHomePath: (role: string) => `/${role}/home`,
}));

vi.mock('@context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), resolvedTheme: 'light' }),
}));

vi.mock('@components/ui/GoogleSignInButton', () => ({
  default: () => <div data-testid="google-signin">Google Sign In</div>,
}));

vi.mock('@components/ThemeToggle', () => ({
  default: () => <button type="button">Theme</button>,
}));

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: '1',
    name: 'New User',
    email: 'new@example.com',
    role: Role.STUDENT,
    hasConsented: true,
    ...overrides,
  };
}

/** Fill step 1 fields and advance to step 2 */
async function fillStep1AndContinue() {
  fireEvent.change(screen.getByLabelText('Full Name'), {
    target: { value: 'New User' },
  });
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'new@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'SecurePass123!' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

  // Wait for step 2 to render
  await waitFor(() => {
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
  });
}

/** Fill step 2 fields */
function fillStep2() {
  fireEvent.change(screen.getByLabelText('Gender'), {
    target: { value: 'MALE' },
  });
  fireEvent.change(screen.getByLabelText('Academic Year'), {
    target: { value: '1' },
  });
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, email, and password fields on step 1', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('submits form and navigates on successful registration', async () => {
    const user = makeUser();
    mockRegister.mockResolvedValueOnce(user);

    render(<RegisterPage />);

    await fillStep1AndContinue();
    fillStep2();

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'New User',
        'new@example.com',
        'SecurePass123!',
        'MALE',
        '1',
      );
      expect(mockNavigate).toHaveBeenCalledWith('/STUDENT/home', { replace: true });
    });
  });

  it('displays server error on ApiError', async () => {
    const errorResponse = {
      success: false as const,
      error: {
        code: 'DUPLICATE_EMAIL',
        message: 'Email already registered',
        retryable: false,
      },
      correlationId: 'test',
    };
    mockRegister.mockRejectedValueOnce(new ApiError(errorResponse, 409));

    render(<RegisterPage />);

    await fillStep1AndContinue();
    fillStep2();

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('displays generic error for non-ApiError exceptions', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Network failure'));

    render(<RegisterPage />);

    await fillStep1AndContinue();
    fillStep2();

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    let resolveRegister: (value: UserProfile) => void;
    mockRegister.mockReturnValueOnce(
      new Promise<UserProfile>((resolve) => {
        resolveRegister = resolve;
      }),
    );

    render(<RegisterPage />);

    await fillStep1AndContinue();
    fillStep2();

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find((b) => b.getAttribute('type') === 'submit');
      expect(submitBtn).toBeDisabled();
    });

    resolveRegister!(makeUser());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
