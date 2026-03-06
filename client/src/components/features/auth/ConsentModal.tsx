import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';

const CONSENT_VERSION = '1.0';

export default function ConsentModal() {
  const { setConsented } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Block Escape key from dismissing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleAccept = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch('/consents', {
        method: 'POST',
        body: JSON.stringify({ version: CONSENT_VERSION }),
      });
      setConsented();
    } catch {
      setError('Failed to record consent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [setConsented]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="mx-4 w-full max-w-lg rounded-xl bg-[hsl(var(--card))] p-6 shadow-2xl sm:p-8">
        <h2
          id="consent-title"
          className="mb-4 text-xl font-semibold text-[hsl(var(--card-foreground))]"
        >
          Privacy Notice & Data Consent
        </h2>

        <div className="mb-6 max-h-64 overflow-y-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          <p className="mb-3">
            Welcome to SmartHostel. Before you proceed, please read and acknowledge the following
            privacy notice.
          </p>

          <h3 className="mb-1 font-medium text-[hsl(var(--card-foreground))]">
            Data We Collect
          </h3>
          <p className="mb-3">
            We collect your name, email address, room assignment, and hostel activity data including
            leave requests, gate pass usage, and entry/exit timestamps. This data is necessary to
            manage hostel operations, ensure student safety, and maintain accurate records.
          </p>

          <h3 className="mb-1 font-medium text-[hsl(var(--card-foreground))]">
            How We Use Your Data
          </h3>
          <p className="mb-3">
            Your data is used to process leave requests, generate gate passes, track hostel
            occupancy, and enable authorized staff (wardens, guards, maintenance) to perform their
            duties. Data is not shared with third parties outside the hostel administration.
          </p>

          <h3 className="mb-1 font-medium text-[hsl(var(--card-foreground))]">
            Data Retention
          </h3>
          <p className="mb-3">
            Activity records are retained for the duration of your enrollment. Gate scan logs are
            archived for up to one year for audit purposes. You may request access to your data by
            contacting the hostel administration.
          </p>

          <h3 className="mb-1 font-medium text-[hsl(var(--card-foreground))]">
            Your Rights
          </h3>
          <p>
            You have the right to access, correct, and request deletion of your personal data
            subject to applicable regulations and institutional policies. Consent is required to use
            this system.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Recording consent...' : 'I Accept'}
        </button>

        <p className="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
          By clicking "I Accept", you acknowledge that you have read and agree to the above privacy
          notice. Consent version: {CONSENT_VERSION}
        </p>
      </div>
    </div>
  );
}
