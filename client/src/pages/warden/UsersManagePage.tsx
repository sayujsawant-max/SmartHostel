import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

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

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

export default function UsersManagePage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    block: '',
    floor: '',
    roomNumber: '',
  });
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

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex justify-between items-center">
          <PageHeader title="User Management" description="Create and manage hostel users." />
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium"
          >
            {showForm ? 'Cancel' : '+ Add User'}
          </button>
        </div>
      </Reveal>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleCreate} className="card-glow bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                    <option value="STUDENT">Student</option>
                    <option value="WARDEN_ADMIN">Warden / Admin</option>
                    <option value="GUARD">Guard</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
                  <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} className={inputCls} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Room Number</label>
                  <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className={inputCls} placeholder="Optional" />
                </div>
              </div>
              {error && <ErrorBanner message={error} />}
              <button type="submit" className="w-full py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium text-sm">
                Create User
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <PageSkeleton />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Create a new user to get started." />
      ) : (
        <StaggerContainer stagger={0.04} className="space-y-2">
          {users.map((u) => (
            <StaggerItem key={u._id}>
            <div className="card-glow bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 flex justify-between items-center hover:shadow-sm transition-shadow">
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">{u.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {u.email} | {u.role.replace(/_/g, ' ')}
                  {u.block && ` | Block ${u.block}`}
                  {u.roomNumber && ` Room ${u.roomNumber}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant={u.isActive ? 'success' : 'error'}>
                  {u.isActive ? 'Active' : 'Disabled'}
                </StatusBadge>
                {u.isActive ? (
                  <button
                    onClick={() => handleDisable(u._id)}
                    className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnable(u._id)}
                    className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
