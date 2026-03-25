// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ThemeToggle from './ThemeToggle';

const mockSetTheme = vi.fn();
let mockTheme = 'light' as string;

vi.mock('@context/ThemeContext', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme, resolvedTheme: 'light' }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockTheme = 'light';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays correct aria-label for light theme', () => {
    mockTheme = 'light';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Theme: Light. Click to switch.');
  });

  it('displays correct aria-label for dark theme', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Theme: Dark. Click to switch.');
  });

  it('displays correct aria-label for system theme', () => {
    mockTheme = 'system';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Theme: System. Click to switch.');
  });

  it('displays correct aria-label for scheduled theme', () => {
    mockTheme = 'scheduled';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Theme: Auto (7PM\u20136AM). Click to switch.');
  });

  it('cycles from light to dark on click', () => {
    mockTheme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to scheduled on click', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('scheduled');
  });

  it('cycles from scheduled to system on click', () => {
    mockTheme = 'scheduled';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light on click', () => {
    mockTheme = 'system';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('has correct title attribute', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Theme: Dark');
  });

  it('button has type="button" to prevent form submission', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders an SVG icon inside the button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
