import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Search,
  X,
  User,
  Mail,
  Lock,
  Building2,
  Hash,
  ChevronRight,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  block?: string;
  floor?: string;
  roomNumber?: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  STUDENT: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
  WARDEN_ADMIN: { bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' },
  GUARD: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
  MAINTENANCE: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
};

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow';

export default function UsersManagePage() {
  usePageTitle('Users Manage');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    block: '',
    floor: '',
    roomNumber: '',
  });
  const [formStep, setFormStep] = useState(0);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    apiFetch<{ users: UserItem[] }>('/admin/users')
      .then((res) => setUsers(res.data.users))
      .catch((err: unknown) => showError(err, 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          block: form.block || undefined,
          floor: form.floor || undefined,
          roomNumber: form.roomNumber || undefined,
        }),
      });
      setShowForm(false);
      setFormStep(0);
      setForm({ name: '', email: '', password: '', role: 'STUDENT', block: '', floor: '', roomNumber: '' });
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await apiFetch(`/admin/users/${id}/disable`, { method: 'PATCH' });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: false } : u)));
      showSuccess('User disabled');
    } catch (err) {
      showError(err);
    }
  };

  const handleEnable = async (id: string) => {
    try {
      await apiFetch(`/admin/users/${id}/enable`, { method: 'PATCH' });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: true } : u)));
      showSuccess('User enabled');
    } catch (err) {
      showError(err);
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const roleBreakdown = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-[hsl(var(--card))] to-violet-600/10 border border-[hsl(var(--border))] p-6"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Users className="w-24 h-24 text-blue-500" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center"
              whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">User Management</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Create and manage hostel users</p>
            </div>
          </div>
          <motion.button
            onClick={() => { setShowForm(!showForm); setFormStep(0); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity shadow-lg"
          >
            {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add User'}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active', value: activeCount, icon: UserCheck, iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          ...Object.entries(roleBreakdown).slice(0, 2).map(([role, count]) => ({
            label: role.replace(/_/g, ' '),
            value: count,
            icon: Shield,
            iconBg: ROLE_COLORS[role]?.bg ?? 'bg-gray-100 dark:bg-gray-950/40',
            iconColor: ROLE_COLORS[role]?.text ?? 'text-gray-600 dark:text-gray-400',
          })),
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 * i }}
            >
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow card-glow"
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

      {/* Create User Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleCreate} className="card-glow bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-5 space-y-4 shadow-xl shadow-black/5">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Create New User</h3>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center gap-2">
                {['Account Info', 'Role & Location'].map((step, idx) => (
                  <motion.button
                    key={step}
                    type="button"
                    onClick={() => setFormStep(idx)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      formStep === idx
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {step}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {formStep === 0 ? (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                        <User className="w-3 h-3" />
                        Name
                      </label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                        <Lock className="w-3 h-3" />
                        Password
                      </label>
                      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className={inputCls} placeholder="At least 8 characters" />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <motion.button
                        type="button"
                        onClick={() => setFormStep(1)}
                        whileHover={{ scale: 1.03, x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                        <Shield className="w-3 h-3" />
                        Role
                      </label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                        <option value="STUDENT">Student</option>
                        <option value="WARDEN_ADMIN">Warden / Admin</option>
                        <option value="GUARD">Guard</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                        <Building2 className="w-3 h-3" />
                        Block
                      </label>
                      <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} className={inputCls} placeholder="Optional" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                        <Hash className="w-3 h-3" />
                        Room Number
                      </label>
                      <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className={inputCls} placeholder="Optional" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <ErrorBanner message={error} />}

              {formStep === 1 && (
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className="w-full py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </motion.button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name, email, or role..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow"
        />
        <AnimatePresence>
        {searchQuery && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={spring}
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <X className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          </motion.button>
        )}
        </AnimatePresence>
      </motion.div>

      {loading ? (
        <PageSkeleton />
      ) : filteredUsers.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState title="No users found" description={searchQuery ? 'Try adjusting your search query.' : 'Create a new user to get started.'} />
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u, i) => {
            const roleColor = ROLE_COLORS[u.role] ?? { bg: 'bg-gray-100 dark:bg-gray-950/40', text: 'text-gray-600 dark:text-gray-400' };
            return (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.5), ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ y: -2, scale: 1.005 }}
                  transition={spring}
                  className="card-glow bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 flex justify-between items-center hover:shadow-md hover:border-[hsl(var(--accent))]/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar Initials */}
                    <motion.div
                      className={`w-10 h-10 rounded-full ${roleColor.bg} flex items-center justify-center shrink-0 text-sm font-bold ${roleColor.text}`}
                      whileHover={{ scale: 1.1 }}
                      transition={spring}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </motion.div>
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">{u.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        {u.email}
                        {u.block && (
                          <>
                            <span className="opacity-40">|</span>
                            <Building2 className="w-3 h-3" />
                            Block {u.block}
                          </>
                        )}
                        {u.roomNumber && <span>Room {u.roomNumber}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={u.role === 'WARDEN_ADMIN' ? 'accent' : u.role === 'GUARD' ? 'warning' : u.role === 'MAINTENANCE' ? 'info' : 'neutral'}>
                      {u.role.replace(/_/g, ' ')}
                    </StatusBadge>
                    <StatusBadge variant={u.isActive ? 'success' : 'error'}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </StatusBadge>
                    {u.isActive ? (
                      <motion.button
                        onClick={() => handleDisable(u._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Disable
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleEnable(u._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        Enable
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
