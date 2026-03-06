import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

interface Notice {
  _id: string;
  title: string;
  content: string;
  target: 'ALL' | 'BLOCK' | 'FLOOR';
  targetBlock?: string;
  targetFloor?: string;
  isActive: boolean;
  authorId?: { _id: string; name: string };
  createdAt: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'ALL' | 'BLOCK' | 'FLOOR'>('ALL');
  const [targetBlock, setTargetBlock] = useState('');
  const [targetFloor, setTargetFloor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = () => {
    apiFetch<{ notices: Notice[] }>('/notices')
      .then((res) => setNotices(res.data.notices))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/notices', {
        method: 'POST',
        body: JSON.stringify({ title, content, target, targetBlock: target !== 'ALL' ? targetBlock : undefined, targetFloor: target === 'FLOOR' ? targetFloor : undefined }),
      });
      setTitle('');
      setContent('');
      setTarget('ALL');
      setTargetBlock('');
      setTargetFloor('');
      setShowForm(false);
      setLoading(true);
      fetchNotices();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await apiFetch(`/notices/${id}/deactivate`, { method: 'PATCH' });
      setNotices((prev) => prev.map((n) => (n._id === id ? { ...n, isActive: false } : n)));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Notices</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Broadcast notices to students.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
        >
          {showForm ? 'Cancel' : 'New Notice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as 'ALL' | 'BLOCK' | 'FLOOR')}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
            >
              <option value="ALL">All Students</option>
              <option value="BLOCK">Specific Block</option>
              <option value="FLOOR">Specific Block & Floor</option>
            </select>
          </div>
          {target !== 'ALL' && (
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
              <input
                value={targetBlock}
                onChange={(e) => setTargetBlock(e.target.value)}
                required
                placeholder="e.g., A"
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
              />
            </div>
          )}
          {target === 'FLOOR' && (
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Floor</label>
              <input
                value={targetFloor}
                onChange={(e) => setTargetFloor(e.target.value)}
                required
                placeholder="e.g., 2"
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Notice'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : notices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">No notices published yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n._id} className={`p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 ${!n.isActive ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">{n.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {n.target === 'ALL' ? 'All Students' : n.target === 'BLOCK' ? `Block ${n.targetBlock}` : `Block ${n.targetBlock}, Floor ${n.targetFloor}`}
                    {' · '}
                    {n.authorId?.name ?? 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${n.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {n.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {n.isActive && (
                    <button
                      onClick={() => void handleDeactivate(n._id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--foreground))]">{n.content}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
