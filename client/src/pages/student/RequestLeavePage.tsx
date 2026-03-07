import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@services/api';

const LEAVE_TYPES = [
  { value: 'DAY_OUTING', label: 'Day Outing' },
  { value: 'OVERNIGHT', label: 'Overnight' },
];

function toISOWithOffset(dateStr: string): string {
  const date = new Date(dateStr);
  const offsetMs = date.getTimezoneOffset() * -60_000;
  const sign = offsetMs >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMs);
  const hours = String(Math.floor(absOffset / 3_600_000)).padStart(2, '0');
  const minutes = String(Math.floor((absOffset % 3_600_000) / 60_000)).padStart(2, '0');
  return `${dateStr}T00:00:00.000${sign}${hours}:${minutes}`;
}

export default function RequestLeavePage() {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!type) {
      setError('Please select a leave type');
      return;
    }
    if (!startDate) {
      setError('Please select a start date');
      return;
    }
    if (!endDate) {
      setError('Please select an end date');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/leaves', {
        method: 'POST',
        body: JSON.stringify({
          type,
          startDate: toISOWithOffset(startDate),
          endDate: toISOWithOffset(endDate),
          reason: reason.trim(),
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 p-4">
        <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center">
          <p className="text-lg font-semibold text-green-800">Leave Request Submitted</p>
          <p className="text-sm text-green-700 mt-1">Your request is pending warden approval.</p>
          <button
            onClick={() => navigate('/student/status')}
            className="mt-4 px-4 py-2 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium"
          >
            View Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Request Leave</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Apply for a day outing or overnight leave
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Leave Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
          >
            <option value="">Select type...</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate(e.target.value);
              }}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Why do you need leave?"
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] resize-none"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{reason.length}/500</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
}
