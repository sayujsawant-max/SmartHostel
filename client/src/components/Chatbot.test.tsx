// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Chatbot from './Chatbot';

// Mock motion/react — jsdom doesn't run animations, so pass through as plain elements
vi.mock('motion/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: object, prop: string) =>
        React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const {
            initial, animate, exit, transition,
            whileHover, whileTap, variants,
            layout, layoutId, custom,
            ...rest
          } = props;
          void initial; void animate; void exit; void transition;
          void whileHover; void whileTap; void variants;
          void layout; void layoutId; void custom;
          return React.createElement(prop, { ...rest, ref });
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock react-markdown — avoid ESM issues in jsdom
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

// Mock useAuth — Chatbot uses useAuth for user name
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'STUDENT' },
    isAuthenticated: true,
  }),
}));

// Helper to create a ReadableStream from SSE chunks
function createMockSSEStream(chunks: string[]) {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('Chatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders toggle button', () => {
    render(<Chatbot />);
    expect(screen.getByRole('button', { name: 'Toggle chatbot' })).toBeInTheDocument();
  });

  it('opens chat window on toggle click', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    expect(screen.getByText('SmartHostel AI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Message SmartHostel AI...')).toBeInTheDocument();
  });

  it('shows greeting message on open', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    expect(screen.getByText(/How can I help/)).toBeInTheDocument();
  });

  it('sends user message and calls streaming API', async () => {
    const user = userEvent.setup();
    // Mock fetch to return a simple stream that closes immediately
    const mockStream = createMockSSEStream(['data: [DONE]\n\n']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    render(<Chatbot />);
    await user.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Message SmartHostel AI...');
    await user.type(input, 'leave question');

    // Find and click the send button — it's the last button in the chat form
    const allButtons = screen.getAllByRole('button');
    // The send button is the small one with an SVG inside, find it by exclusion
    const sendBtn = allButtons.filter(
      (b) => b.getAttribute('aria-label') !== 'Toggle chatbot' && b.closest('.fixed.bottom-36'),
    );

    // Click the last non-toggle button (the send icon)
    if (sendBtn.length > 0) {
      await user.click(sendBtn[sendBtn.length - 1]);
    }

    // Wait for message and fetch
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    // Verify fetch was called with streaming endpoint
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/assistant/chat/stream',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
  });

  it('shows error when stream fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      body: null,
    } as unknown as Response);

    render(<Chatbot />);
    await user.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Message SmartHostel AI...');
    await user.type(input, 'test query');

    // Click the send button
    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons.find(
      (b) => !b.getAttribute('aria-label') && !b.hasAttribute('disabled') && b !== screen.getByRole('button', { name: 'Toggle chatbot' }),
    );

    if (sendBtn) {
      await user.click(sendBtn);
    } else {
      await user.keyboard('{Enter}');
    }

    // Wait for async error handling
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(screen.getByText('Failed to connect to AI assistant')).toBeInTheDocument();
  });

  it('does not send empty messages', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Message SmartHostel AI...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // No user message bubble should appear (only greeting exists)
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });

  it('displays suggestion chips', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    // Suggestion chips should be visible
    expect(screen.getByText(/My Leaves/)).toBeInTheDocument();
    expect(screen.getByText(/My Complaints/)).toBeInTheDocument();
  });
});
