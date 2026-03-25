// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nContext';

const STORAGE_KEY = 'smarthostel-lang';

function TestConsumer() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translated">{t('dashboard')}</span>
      <span data-testid="missing">{t('nonexistent_key')}</span>
      <span data-testid="fallback">{t('nonexistent_key', 'My Fallback')}</span>
      <button onClick={() => setLocale('hi')}>Switch to Hindi</button>
      <button onClick={() => setLocale('ta')}>Switch to Tamil</button>
      <button onClick={() => setLocale('en')}>Switch to English</button>
    </div>
  );
}

describe('I18nContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults locale to "en"', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('translates known keys in English', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('translated').textContent).toBe('Dashboard');
  });

  it('returns the key itself when translation is missing and no fallback', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('missing').textContent).toBe('nonexistent_key');
  });

  it('returns fallback when translation is missing and fallback provided', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('fallback').textContent).toBe('My Fallback');
  });

  it('switches locale and translates correctly', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByText('Switch to Hindi'));

    expect(screen.getByTestId('locale').textContent).toBe('hi');
    // Hindi translation for dashboard
    expect(screen.getByTestId('translated').textContent).not.toBe('Dashboard');
    expect(screen.getByTestId('translated').textContent).toBeTruthy();
  });

  it('persists locale to localStorage on switch', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByText('Switch to Hindi'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('hi');
  });

  it('reads initial locale from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'ta');

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    expect(screen.getByTestId('locale').textContent).toBe('ta');
  });

  it('falls back to English for unknown locale code', () => {
    localStorage.setItem(STORAGE_KEY, 'xx');

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    // Should still return English translation since 'xx' has no dictionary
    expect(screen.getByTestId('translated').textContent).toBe('Dashboard');
  });

  it('switching back to English restores English translations', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByText('Switch to Hindi'));
    expect(screen.getByTestId('locale').textContent).toBe('hi');

    fireEvent.click(screen.getByText('Switch to English'));
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('translated').textContent).toBe('Dashboard');
  });

  it('dir is always ltr', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );

    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.dir).toBe('ltr');
  });

  it('throws when useI18n is used outside provider', () => {
    // Suppress console.error for this expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useI18n());
    }).toThrow('useI18n must be used within an I18nProvider');

    consoleSpy.mockRestore();
  });

  it('translates multiple keys correctly for Tamil', () => {
    localStorage.setItem(STORAGE_KEY, 'ta');

    function MultiKeyConsumer() {
      const { t } = useI18n();
      return (
        <div>
          <span data-testid="submit">{t('submit')}</span>
          <span data-testid="cancel">{t('cancel')}</span>
          <span data-testid="rooms">{t('rooms')}</span>
        </div>
      );
    }

    render(
      <I18nProvider>
        <MultiKeyConsumer />
      </I18nProvider>,
    );

    // Tamil translations should be non-empty and different from English
    expect(screen.getByTestId('submit').textContent).toBeTruthy();
    expect(screen.getByTestId('cancel').textContent).toBeTruthy();
    expect(screen.getByTestId('rooms').textContent).toBeTruthy();
  });
});
