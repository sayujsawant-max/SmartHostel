import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { Reveal } from '@/components/motion';

import StatusBadge from '@components/ui/StatusBadge';
import Spinner from '@components/ui/Spinner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  Megaphone,
  Plus,
  X,
  Eye,
  EyeOff,
  Users,
  Building2,
  Layers,
  Send,
  Bell,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

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
  usePageTitle('Notices');
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

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow';

  const activeCount = notices.filter((n) => n.isActive).length;
  const inactiveCount = notices.filter((n) => !n.isActive).length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/10 via-[hsl(var(--card))] to-indigo-600/10 border border-[hsl(var(--border))] p-6 morph-gradient"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Megaphone className="w-24 h-24 text-violet-500" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center"
                whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Bell className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] gradient-heading">Notices</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Broadcast notices to students</p>
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary))]/20"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Notice'}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Notices', value: notices.length, icon: Megaphone, iconBg: 'bg-blue-100 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active', value: activeCount, icon: Eye, iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Inactive', value: inactiveCount, icon: EyeOff, iconBg: 'bg-gray-100 dark:bg-gray-950/40', iconColor: 'text-gray-600 dark:text-gray-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow card-glow card-shine"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      <AnimatedCounter to={stat.value} />
                    </p>
                  </div>
                  <motion.div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}
                    whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Notice Modal */}
      <AnimatePresence>
      {showForm && (
        <motion.div
          key="notice-form"
          initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
        <form onSubmit={(e) => void handleSubmit(e)} className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-4 shadow-xl shadow-black/5">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Create New Notice</h3>
          </div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={3} className={`${inputCls} resize-none`} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Target</label>
            <div className="flex gap-2">
              {([
                { key: 'ALL' as const, label: 'All Students', icon: Users },
                { key: 'BLOCK' as const, label: 'Block', icon: Building2 },
                { key: 'FLOOR' as const, label: 'Block & Floor', icon: Layers },
              ]).map((t) => {
                const TIcon = t.icon;
                return (
                  <motion.button
                    key={t.key}
                    type="button"
                    onClick={() => setTarget(t.key)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                    className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      target === t.key
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                    }`}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    {t.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
          <AnimatePresence>
          {target !== 'ALL' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
              <input value={targetBlock} onChange={(e) => setTargetBlock(e.target.value)} required placeholder="e.g., A" className={inputCls} />
            </motion.div>
          )}
          </AnimatePresence>
          <AnimatePresence>
          {target === 'FLOOR' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Floor</label>
              <input value={targetFloor} onChange={(e) => setTargetFloor(e.target.value)} required placeholder="e.g., 2" className={inputCls} />
            </motion.div>
          )}
          </AnimatePresence>
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[hsl(var(--primary))]/20"
          >
            {submitting && <Spinner size="h-4 w-4" />}
            {submitting ? 'Publishing...' : 'Publish Notice'}
          </motion.button>
        </form>
        </motion.div>
      )}
      </AnimatePresence>

      {loading ? (
        <PageSkeleton />
      ) : notices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState title="No notices published yet" description="Create your first notice to broadcast to students." />
        </motion.div>
      ) : (
        <Reveal>
        <div className="space-y-3">
          {notices.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.5), ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.005 }}
                transition={spring}
                className={`card-glow card-shine p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2 hover:shadow-md hover:border-[hsl(var(--accent))]/40 transition-all ${!n.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <motion.div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.isActive ? 'bg-violet-100 dark:bg-violet-950/40' : 'bg-gray-100 dark:bg-gray-900/40'}`}
                      whileHover={{ rotate: 12 }}
                      transition={spring}
                    >
                      <Megaphone className={`w-4 h-4 ${n.isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`} />
                    </motion.div>
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">{n.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {n.target === 'ALL' ? 'All Students' : n.target === 'BLOCK' ? `Block ${n.targetBlock}` : `Block ${n.targetBlock}, Floor ${n.targetFloor}`}
                        {' · '}
                        {n.authorId?.name ?? 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={n.isActive ? 'success' : 'neutral'}>
                      {n.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                    {n.isActive && (
                      <motion.button
                        onClick={() => void handleDeactivate(n._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        className="text-xs px-2.5 py-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Deactivate
                      </motion.button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[hsl(var(--foreground))] pl-12">{n.content}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] pl-12">
                  {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
        </Reveal>
      )}
    </div>
  );
}
