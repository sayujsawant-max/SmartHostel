import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { Package, Plus, Search, AlertTriangle, CheckCircle2, Wrench, Archive } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
  lastRestocked: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'error',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function InventoryPage() {
  usePageTitle('Inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', quantity: 0, minStock: 5, unit: 'pcs', location: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<InventoryItem[]>('/maintenance/inventory')
      .then(res => setItems(res.data))
      .catch(err => showError(err, 'Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/maintenance/inventory', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } });
      showSuccess('Item added!');
      setShowForm(false);
      setForm({ name: '', category: '', quantity: 0, minStock: 5, unit: 'pcs', location: '' });
      const res = await apiFetch<InventoryItem[]>('/maintenance/inventory');
      setItems(res.data);
    } catch (err) {
      showError(err, 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const lowStock = items.filter(i => i.status === 'LOW_STOCK').length;
  const outOfStock = items.filter(i => i.status === 'OUT_OF_STOCK').length;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const filtered = items.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (search) return i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const summaryCards = [
    { label: 'Total Items', value: totalItems, icon: Package, iconClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Categories', value: new Set(items.map(i => i.category)).size, icon: Archive, iconClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-100 dark:bg-violet-950/40' },
    { label: 'Low Stock', value: lowStock, icon: AlertTriangle, iconClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-950/40' },
    { label: 'Out of Stock', value: outOfStock, icon: Wrench, iconClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-100 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex items-center justify-between">
          <PageHeader title="Parts Inventory" description="Track maintenance supplies and spare parts" />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring} onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-xs font-semibold shadow-sm">
            <Plus size={14} /> Add Item
          </motion.button>
        </div>
      </Reveal>

      <StaggerContainer className="grid grid-cols-4 gap-3" stagger={0.06}>
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm card-glow">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/25 to-transparent" />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}><Icon size={14} className={card.iconClass} /></div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
                </div>
                <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums"><AnimatedCounter to={card.value} /></p>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Search & Filter */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 transition-all" />
        </div>
        <div className="flex gap-2">
          {['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map(s => (
            <motion.button key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring} onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterStatus === s ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
            >
              {s ? s.replace(/_/g, ' ') : 'All'}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--accent))]/30 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Add New Item</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item Name" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
                <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} placeholder="Quantity" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring} onClick={() => void handleAdd()} disabled={submitting} className="w-full py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Item'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item List */}
      {filtered.length === 0 ? (
        <EmptyState variant="compact" title="No items found" description="No inventory items match your search." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item, i) => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <motion.div whileHover={{ y: -2, scale: 1.005 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/25 hover:shadow-sm transition-all duration-200 card-glow accent-line">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[hsl(var(--foreground))]">{item.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.category} · {item.location}</p>
                  </div>
                  <StatusBadge variant={STATUS_VARIANT[item.status] ?? 'neutral'}>{item.status.replace(/_/g, ' ')}</StatusBadge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">{item.quantity} {item.unit}</span>
                  <div className="flex-1 h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${item.quantity > item.minStock ? 'bg-[hsl(var(--accent))]' : item.quantity > 0 ? 'bg-amber-500' : 'bg-[hsl(var(--destructive))]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((item.quantity / (item.minStock * 3)) * 100, 100)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03 }}
                    />
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Min: {item.minStock}</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
