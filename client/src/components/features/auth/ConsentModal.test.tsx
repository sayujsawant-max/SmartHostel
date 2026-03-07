// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConsentModal from './ConsentModal';
import type { AuthContextType } from '@context/auth-context-value';

// Mock useAuth hook
const mockSetConsented = vi.fn();
vi.mock('@hooks/useAuth', () => ({
  useAuth: (): Pick<AuthContextType, 'setConsented'> => ({
    setConsented: mockSetConsented,
  }),
}));

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('@services/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

describe('ConsentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders privacy notice text', () => {
    render(<ConsentModal />);
    expect(screen.getByText('Privacy Notice & Data Consent')).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to SmartHostel/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Data We Collect/)).toBeInTheDocument();
  });

  it('"I Accept" button is present', () => {
    render(<ConsentModal />);
    expect(screen.getByRole('button', { name: 'I Accept' })).toBeInTheDocument();
  });

  it('Escape key does NOT dismiss the modal', () => {
    render(<ConsentModal />);
    fireEvent.keyDown(window, { key: 'Escape' });
    // Modal should still be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Privacy Notice & Data Consent')).toBeInTheDocument();
  });

  it('shows loading state when Accept button is clicked', async () => {
    // Make apiFetch hang so we can observe the loading state
    mockApiFetch.mockImplementation(
      () => new Promise<void>((resolve) => setTimeout(resolve, 500)),
    );

    render(<ConsentModal />);

    const button = screen.getByRole('button', { name: 'I Accept' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Recording consent...' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls apiFetch with correct payload and setConsented on success', async () => {
    mockApiFetch.mockResolvedValueOnce({});

    render(<ConsentModal />);

    fireEvent.click(screen.getByRole('button', { name: 'I Accept' }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/consents', {
        method: 'POST',
        body: JSON.stringify({ version: '1.0' }),
      });
      expect(mockSetConsented).toHaveBeenCalled();
    });
  });

  it('shows error message when API call fails', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ConsentModal />);

    fireEvent.click(screen.getByRole('button', { name: 'I Accept' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to record consent. Please try again.')).toBeInTheDocument();
    });

    expect(mockSetConsented).not.toHaveBeenCalled();
  });
});
