// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Chatbot from './Chatbot';

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('@services/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const SAMPLE_FAQS = [
  {
    _id: '1',
    question: 'How do I apply for leave?',
    answer: 'Go to the Leaves section and tap "Apply for Leave".',
    category: 'leaves',
    keywords: ['leave', 'apply', 'request'],
  },
  {
    _id: '2',
    question: 'What are the hostel fees?',
    answer: 'Fees vary by room type. Check the Rooms section for details.',
    category: 'fees',
    keywords: ['fees', 'payment', 'cost'],
  },
];

describe('Chatbot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue({ data: { faqs: SAMPLE_FAQS } });
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Wait for the FAQ useEffect to resolve */
  async function waitForFaqLoad() {
    await act(async () => {
      await vi.runAllTimersAsync();
    });
  }

  it('renders toggle button', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();
    expect(screen.getByRole('button', { name: 'Toggle chatbot' })).toBeInTheDocument();
  });

  it('opens chat window on toggle click', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    expect(screen.getByText('SmartHostel Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
  });

  it('shows greeting message on open', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    expect(screen.getByText(/I'm the SmartHostel assistant/)).toBeInTheDocument();
  });

  it('sends user message and receives FAQ match', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'How do I apply for leave?' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // User message appears
    expect(screen.getByText('How do I apply for leave?')).toBeInTheDocument();

    // Advance past the 300ms setTimeout for bot response
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getByText('Go to the Leaves section and tap "Apply for Leave".')).toBeInTheDocument();
  });

  it('shows fallback for unrecognized query', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'xyzzy gibberish nonsense' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getByText(/I'm not sure about that/)).toBeInTheDocument();
  });

  it('responds to greeting', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    // The greeting response should appear (there's already one from initial render + new one)
    const greetings = screen.getAllByText(/I'm the SmartHostel assistant/);
    expect(greetings.length).toBeGreaterThanOrEqual(2);
  });

  it('does not send empty messages', async () => {
    render(<Chatbot />);
    await waitForFaqLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // No user message bubble should appear
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });
});
