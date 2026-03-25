// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Mock Sentry to avoid side effects
vi.mock('@/config/sentry', () => ({
  Sentry: {
    captureException: vi.fn(),
  },
}));

// A component that throws on render
function ThrowingComponent({ message }: { message: string }) {
  throw new Error(message);
}

// A component that renders normally
function GoodComponent() {
  return <div>All is well</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error output from React error boundary logging
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('All is well')).toBeTruthy();
  });

  it('renders fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test crash" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows the error message in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Specific error message" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Specific error message')).toBeTruthy();
  });

  it('shows a "Try Again" button in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Crash" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('shows a "Go Home" button in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Crash" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Go Home')).toBeTruthy();
  });

  it('shows descriptive paragraph in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Crash" />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText('An unexpected error occurred. Please try refreshing the page.'),
    ).toBeTruthy();
  });

  it('calls Sentry.captureException when error is caught', async () => {
    const { Sentry } = await import('@/config/sentry');
    (Sentry.captureException as ReturnType<typeof vi.fn>).mockClear();

    render(
      <ErrorBoundary>
        <ThrowingComponent message="Sentry test" />
      </ErrorBoundary>,
    );

    expect(Sentry.captureException).toHaveBeenCalled();
    const call = (Sentry.captureException as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBeInstanceOf(Error);
    expect(call[0].message).toBe('Sentry test');
  });
});
