import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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
      .catch(() => {})
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
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">User Management</h2>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">Create and manage hostel users.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm">
                <option value="STUDENT">Student</option>
                <option value="WARDEN_ADMIN">Warden / Admin</option>
                <option value="GUARD">Guard</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
              <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Room Number</label>
              <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" placeholder="Optional" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium text-sm">
            Create User
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <p>No users found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">{u.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {u.email} | {u.role.replace(/_/g, ' ')}
                  {u.block && ` | Block ${u.block}`}
                  {u.roomNumber && ` Room ${u.roomNumber}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {u.isActive ? 'Active' : 'Disabled'}
                </span>
                {u.isActive && (
                  <button
                    onClick={() => handleDisable(u._id)}
                    className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs hover:bg-red-200"
                  >
                    Disable
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
