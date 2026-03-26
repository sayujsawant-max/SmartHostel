import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@hooks/usePageTitle';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import {
  QrCode,
  Search,
  Plus,
  X,
  Armchair,
  Zap,
  Droplets,
  Wind,
  Monitor,
  Package,
  ScanLine,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Wrench,
  Camera,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

type AssetStatus = 'WORKING' | 'NEEDS_REPAIR' | 'UNDER_REPAIR' | 'DECOMMISSIONED';

interface Asset {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
  location: { block: string; floor: string; room: string };
  status: AssetStatus;
  lastMaintenanceDate: string | null;
}

const CATEGORIES = ['FURNITURE', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_EQUIPMENT', 'OTHER'] as const;

const categoryLabels: Record<string, string> = {
  FURNITURE: 'Furniture',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  IT_EQUIPMENT: 'IT Equipment',
  OTHER: 'Other',
};

const categoryIcons: Record<string, React.ReactNode> = {
  FURNITURE: <Armchair className="h-4 w-4" />,
  ELECTRICAL: <Zap className="h-4 w-4" />,
  PLUMBING: <Droplets className="h-4 w-4" />,
  HVAC: <Wind className="h-4 w-4" />,
  IT_EQUIPMENT: <Monitor className="h-4 w-4" />,
  OTHER: <Package className="h-4 w-4" />,
};

const statusConfig: Record<AssetStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  WORKING: {
    label: 'Healthy',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  NEEDS_REPAIR: {
    label: 'Needs Repair',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  UNDER_REPAIR: {
    label: 'Under Repair',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  DECOMMISSIONED: {
    label: 'Decommissioned',
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    icon: <Ban className="h-3.5 w-3.5" />,
  },
};

export default function AssetTrackingPage() {
  usePageTitle('Asset Tracking');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [qrOverlay, setQrOverlay] = useState<string | null>(null);

  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'FURNITURE',
    block: '',
    floor: '',
    room: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await apiFetch<Asset[] | { assets: Asset[] }>('/assets');
      const d = res.data;
      const list = Array.isArray(d) ? d : d?.assets ?? [];
      setAssets(list);
    } catch {
      showError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleAddAsset = async () => {
    if (!newAsset.name.trim() || !newAsset.block.trim() || !newAsset.floor.trim() || !newAsset.room.trim()) {
      showError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const assetTag = 'AST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: newAsset.name,
          assetTag,
          category: newAsset.category,
          location: `${newAsset.block}-${newAsset.floor}-${newAsset.room}`,
          status: 'WORKING',
        }),
      });
      showSuccess('Asset added successfully');
      setShowAddForm(false);
      setNewAsset({ name: '', category: 'FURNITURE', block: '', floor: '', room: '' });
      fetchAssets();
    } catch {
      showError('Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetTag?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const counts = {
    total: assets.length,
    healthy: assets.filter((a) => a.status === 'WORKING').length,
    needsRepair: assets.filter((a) => a.status === 'NEEDS_REPAIR').length,
    decommissioned: assets.filter((a) => a.status === 'DECOMMISSIONED').length,
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <Reveal>
      <PageHeader
        title={<span className="gradient-heading">Asset Tracking</span>}
        subtitle="QR-based asset management and maintenance tracking"
      />
      </Reveal>

      {/* Summary Cards */}
      <Reveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            { label: 'Total Assets', value: counts.total, color: 'text-[hsl(var(--foreground))]' },
            { label: 'Healthy', value: counts.healthy, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Needs Repair', value: counts.needsRepair, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Decommissioned', value: counts.decommissioned, color: 'text-gray-500 dark:text-gray-400' },
          ].map((card) => (
            <motion.div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 card-glow card-shine"
              whileHover={{ y: -2 }}
              transition={spring}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/25 to-transparent" />
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.color}`}>
                <AnimatedCounter value={card.value} />
              </p>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* Top Actions */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => setShowScanner((p) => !p)}
          >
            <ScanLine className="h-4 w-4" />
            Scan QR
          </motion.button>
          <motion.button
            className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))]"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => setShowAddForm((p) => !p)}
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? 'Cancel' : 'Add Asset'}
          </motion.button>
        </div>
      </Reveal>

      {/* QR Scanner Mock */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 glass-card">
              <div className="mx-auto flex max-w-xs flex-col items-center gap-4">
                <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl bg-black/90 dark:bg-black">
                  {/* Corner brackets */}
                  <div className="absolute left-3 top-3 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-emerald-400" />
                  <div className="absolute right-3 top-3 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-emerald-400" />
                  <div className="absolute bottom-3 left-3 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-3 right-3 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-emerald-400" />
                  {/* Scanning line */}
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-emerald-400/80"
                    initial={{ top: '15%' }}
                    animate={{ top: ['15%', '85%', '15%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <Camera className="h-10 w-10 text-gray-600" />
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Point camera at asset QR code to scan
                </p>
                <motion.button
                  className="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))]"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={() => setShowScanner(false)}
                >
                  Close Scanner
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Asset Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 glass-card">
              <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Add New Asset</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    placeholder="e.g., Ceiling Fan"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Category</label>
                  <select
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    value={newAsset.category}
                    onChange={(e) => setNewAsset((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabels[c] ?? c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Block *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    placeholder="A"
                    value={newAsset.block}
                    onChange={(e) => setNewAsset((p) => ({ ...p, block: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Floor *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    placeholder="2"
                    value={newAsset.floor}
                    onChange={(e) => setNewAsset((p) => ({ ...p, floor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Room *</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    placeholder="204"
                    value={newAsset.room}
                    onChange={(e) => setNewAsset((p) => ({ ...p, room: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <motion.button
                  className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  disabled={submitting}
                  onClick={handleAddAsset}
                >
                  {submitting ? (
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting ? 'Adding...' : 'Add Asset'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <Reveal>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              placeholder="Search by name or asset tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <motion.button
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                !categoryFilter
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              onClick={() => setCategoryFilter(null)}
            >
              All
            </motion.button>
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              >
                {categoryIcons[cat]}
                {categoryLabels[cat] ?? cat}
              </motion.button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Asset List */}
      <StaggerContainer className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center"
            >
              <Package className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">No assets found</p>
            </motion.div>
          ) : (
            filtered.map((asset) => (
              <StaggerItem key={asset._id}>
                <motion.div
                  layout
                  className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 card-glow accent-line card-shine magnetic-hover"
                  whileHover={{ y: -1 }}
                  transition={spring}
                >
                  {/* Main row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedAsset(expandedAsset === asset._id ? null : asset._id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                          {categoryIcons[asset.category] ?? <Package className="h-4 w-4" />}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">{asset.name}</h4>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {asset.assetTag} &middot; {asset.location.block}-{asset.location.floor}-
                            {asset.location.room}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${statusConfig[asset.status].bg} ${statusConfig[asset.status].color}`}
                        >
                          {statusConfig[asset.status].icon}
                          {statusConfig[asset.status].label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                          <Clock className="h-3 w-3" />
                          Last maintained {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        onClick={() => setQrOverlay(qrOverlay === asset._id ? null : asset._id)}
                        title="Show QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))]"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        onClick={() => setExpandedAsset(expandedAsset === asset._id ? null : asset._id)}
                      >
                        {expandedAsset === asset._id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* QR Overlay */}
                  <AnimatePresence>
                    {qrOverlay === asset._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={spring}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-white p-4 dark:bg-gray-900">
                          <div className="grid h-28 w-28 grid-cols-5 grid-rows-5 gap-0.5">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-sm ${
                                  [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 21, 22, 24].includes(i)
                                    ? 'bg-gray-900 dark:bg-gray-100'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{asset.assetTag}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedAsset === asset._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={spring}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 border-t border-[hsl(var(--border))] pt-3">
                          <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Asset Details
                          </h5>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-[hsl(var(--muted))] p-2.5">
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">Category</span>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{categoryLabels[asset.category] ?? asset.category}</p>
                            </div>
                            <div className="rounded-lg bg-[hsl(var(--muted))] p-2.5">
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">Location</span>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                {asset.location.block}-{asset.location.floor}-{asset.location.room}
                              </p>
                            </div>
                            <div className="rounded-lg bg-[hsl(var(--muted))] p-2.5">
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">Status</span>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                {statusConfig[asset.status].label}
                              </p>
                            </div>
                            <div className="rounded-lg bg-[hsl(var(--muted))] p-2.5">
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">Last Maintenance</span>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </StaggerItem>
            ))
          )}
        </AnimatePresence>
      </StaggerContainer>
    </div>
  );
}
