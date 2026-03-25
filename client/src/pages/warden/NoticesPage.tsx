import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import Spinner from '@components/ui/Spinner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

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
      .catch((err: unknown) => showError(err, 'Failed to load data'))
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
      showSuccess('Notice published');
      setLoading(true);
      fetchNotices();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await apiFetch(`/notices/${id}/deactivate`, { method: 'PATCH' });
      setNotices((prev) => prev.map((n) => (n._id === id ? { ...n, isActive: false } : n)));
      showSuccess('Notice deactivated');
    } catch (err) {
      showError(err);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader
          title="Notices"
          description="Broadcast notices to students."
          action={
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Cancel' : 'New Notice'}
            </button>
          }
        />
      </Reveal>

      <AnimatePresence>
      {showForm && (
        <motion.div key="notice-form" initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }} exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
        <form onSubmit={(e) => void handleSubmit(e)} className="card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Target</label>
            <select value={target} onChange={(e) => setTarget(e.target.value as 'ALL' | 'BLOCK' | 'FLOOR')} className={inputCls}>
              <option value="ALL">All Students</option>
              <option value="BLOCK">Specific Block</option>
              <option value="FLOOR">Specific Block & Floor</option>
            </select>
          </div>
          {target !== 'ALL' && (
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
              <input value={targetBlock} onChange={(e) => setTargetBlock(e.target.value)} required placeholder="e.g., A" className={inputCls} />
            </div>
          )}
          {target === 'FLOOR' && (
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Floor</label>
              <input value={targetFloor} onChange={(e) => setTargetFloor(e.target.value)} required placeholder="e.g., 2" className={inputCls} />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {submitting && <Spinner size="h-4 w-4" />}
            {submitting ? 'Publishing...' : 'Publish Notice'}
          </button>
        </form>
        </motion.div>
      )}
      </AnimatePresence>

      {loading ? (
        <PageSkeleton />
      ) : notices.length === 0 ? (
        <EmptyState title="No notices published yet" description="Create your first notice to broadcast to students." />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n._id}
              className={`card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:border-[hsl(var(--accent))]/40 transition-colors ${!n.isActive ? 'opacity-50' : ''}`}
            >
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
                  <StatusBadge variant={n.isActive ? 'success' : 'neutral'}>
                    {n.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
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
