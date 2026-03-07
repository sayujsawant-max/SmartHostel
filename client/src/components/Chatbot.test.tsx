// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue({ data: { faqs: SAMPLE_FAQS } });
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders toggle button', () => {
    render(<Chatbot />);
    expect(screen.getByRole('button', { name: 'Toggle chatbot' })).toBeInTheDocument();
  });

  it('opens chat window on toggle click', async () => {
    render(<Chatbot />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    expect(screen.getByText('SmartHostel Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
  });

  it('shows greeting message on open', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    expect(screen.getByText(/I'm the SmartHostel assistant/)).toBeInTheDocument();
  });

  it('sends user message and receives FAQ match', async () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    // Wait for FAQs to load
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/assistant/faq');
    });

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'How do I apply for leave?' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // User message appears
    expect(screen.getByText('How do I apply for leave?')).toBeInTheDocument();

    // Bot response appears after timeout
    await waitFor(() => {
      expect(screen.getByText('Go to the Leaves section and tap "Apply for Leave".')).toBeInTheDocument();
    });
  });

  it('shows fallback for unrecognized query', async () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'xyzzy gibberish nonsense' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/I'm not sure about that/)).toBeInTheDocument();
    });
  });

  it('responds to greeting', async () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // The greeting response should appear (there's already one from initial render + new one)
    await waitFor(() => {
      const greetings = screen.getAllByText(/I'm the SmartHostel assistant/);
      expect(greetings.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not send empty messages', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle chatbot' }));

    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Only the initial greeting message should exist
    const messages = screen.getAllByText(/./);
    // No user message bubble should appear
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });
});
