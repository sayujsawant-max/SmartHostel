import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

interface VisitorItem {
  _id: string;
  visitorName: string;
  visitorPhone: string;
  relationship: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  status: string;
  rejectionReason?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
}

const RELATIONSHIPS = ['Parent', 'Sibling', 'Friend', 'Guardian', 'Other'];

const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CHECKED_IN: 'bg-blue-100 text-blue-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

export default function VisitorRegistrationPage() {
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await apiFetch<VisitorItem[]>('/visitors/my');
      setVisitors(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVisitors();
  }, [fetchVisitors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!visitorName.trim()) { setError('Visitor name is required'); return; }
    if (!visitorPhone.trim()) { setError('Visitor phone is required'); return; }
    if (!purpose.trim()) { setError('Purpose is required'); return; }
    if (!expectedDate) { setError('Expected date is required'); return; }

    setSubmitting(true);
    try {
      await apiFetch('/visitors', {
        method: 'POST',
        body: JSON.stringify({
          visitorName: visitorName.trim(),
          visitorPhone: visitorPhone.trim(),
          relationship: relationship || 'Other',
          purpose: purpose.trim(),
          expectedDate,
          expectedTime,
        }),
      });
      setSuccessMsg('Visitor registered successfully!');
      setVisitorName('');
      setVisitorPhone('');
      setRelationship('');
      setPurpose('');
      setExpectedDate('');
      setExpectedTime('');
      void fetchVisitors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register visitor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Visitor Pre-Registration</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Register a visitor in advance for approval
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Visitor Name</label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Phone Number</label>
            <input
              type="tel"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            >
              <option value="">Select...</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Expected Time</label>
            <select
              value={expectedTime}
              onChange={(e) => setExpectedTime(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            >
              <option value="">Select time slot...</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Expected Date</label>
          <input
            type="date"
            value={expectedDate}
            min={today}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Purpose of Visit</label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Why is the visitor coming?"
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] resize-none"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{purpose.length}/300</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{successMsg}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm disabled:opacity-50"
        >
          {submitting ? 'Registering...' : 'Register Visitor'}
        </button>
      </form>

      {/* Visitor List */}
      <div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">My Visitors</h3>
        {loading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No visitors registered yet.</p>
        ) : (
          <div className="space-y-3">
            {visitors.map((v) => (
              <div key={v._id} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">{v.visitorName}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {v.visitorPhone} &middot; {v.relationship}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] ?? ''}`}>
                    {v.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--foreground))]">{v.purpose}</p>
                <div className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap gap-3">
                  <span>Date: {new Date(v.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {v.expectedTime && <span>Time: {v.expectedTime}</span>}
                  {v.checkedInAt && <span>In: {new Date(v.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                  {v.checkedOutAt && <span>Out: {new Date(v.checkedOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {v.status === 'REJECTED' && v.rejectionReason && (
                  <p className="text-xs text-red-600">Reason: {v.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
