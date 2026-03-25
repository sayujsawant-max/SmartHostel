import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { History, User, Shield, Settings, FileText, Search, ChevronDown } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface AuditEvent {
  _id: string;
  action: string;
  actor: { name: string; role: string } | null;
  targetType: string;
  targetId: string;
  details: string;
  ip: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  DELETE: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
  LOGIN: 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  APPROVE: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  REJECT: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function AuditTrailPage() {
  usePageTitle('Audit Trail');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AuditEvent[]>('/admin/audit-trail')
      .then(res => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch(err => showError(err, 'Failed to load audit trail'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  const actions = [...new Set(events.map(e => e.action))];
  const filtered = events.filter(e => {
    if (filterAction && e.action !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.action.toLowerCase().includes(q) || e.details?.toLowerCase().includes(q) || e.actor?.name?.toLowerCase().includes(q) || e.targetType?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Audit Trail" description="System activity log and security events" />
      </Reveal>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]/50 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => setFilterAction('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              !filterAction ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            All
          </motion.button>
          {actions.slice(0, 5).map(action => (
            <motion.button
              key={action}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={() => setFilterAction(action)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterAction === action ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              }`}
            >
              {action}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState variant="compact" title="No events found" description="No audit events match your search." />
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[hsl(var(--border))]" />
          <div className="space-y-1">
            {filtered.map((event, i) => {
              const expanded = expandedId === event._id;
              const actionColor = ACTION_COLORS[event.action] ?? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: -10, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                >
                  <motion.button
                    whileHover={{ x: 2 }}
                    transition={spring}
                    onClick={() => setExpandedId(expanded ? null : event._id)}
                    className="w-full text-left flex items-start gap-4 p-3 pl-10 rounded-xl hover:bg-[hsl(var(--muted))]/30 transition-colors relative"
                  >
                    <div className={`absolute left-3 top-4 w-4 h-4 rounded-full border-2 border-[hsl(var(--background))] ${actionColor.split(' ')[0]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${actionColor}`}>{event.action}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{event.targetType}</span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]/60 ml-auto tabular-nums">
                          {new Date(event.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(var(--foreground))] mt-1 truncate">{event.details || `${event.action} on ${event.targetType}`}</p>
                      {event.actor && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1">
                          <User size={10} /> {event.actor.name} · {event.actor.role}
                        </p>
                      )}
                    </div>
                    <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={spring} className="mt-1 shrink-0">
                      <ChevronDown size={14} className="text-[hsl(var(--muted-foreground))]" />
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden ml-10 mr-3"
                      >
                        <div className="card-glow p-3 rounded-xl bg-[hsl(var(--muted))]/30 text-xs space-y-1 mb-2">
                          <p><span className="font-medium text-[hsl(var(--muted-foreground))]">Target ID:</span> <span className="text-[hsl(var(--foreground))] font-mono">{event.targetId}</span></p>
                          <p><span className="font-medium text-[hsl(var(--muted-foreground))]">IP:</span> <span className="text-[hsl(var(--foreground))] font-mono">{event.ip || 'N/A'}</span></p>
                          <p><span className="font-medium text-[hsl(var(--muted-foreground))]">Time:</span> <span className="text-[hsl(var(--foreground))]">{new Date(event.createdAt).toLocaleString('en-IN')}</span></p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
