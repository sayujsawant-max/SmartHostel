import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';

interface Room {
  _id: string;
  block: string;
  floor: string;
  roomNumber: string;
  hostelGender: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
  photos: string[];
}

export default function RoomsManagePage() {
  usePageTitle('Rooms Manage');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    block: '',
    floor: '',
    roomNumber: '',
    hostelGender: 'BOYS',
    roomType: 'NORMAL',
    acType: 'NON_AC',
    totalBeds: 4,
    feePerSemester: 50000,
    photos: [] as string[],
  });
  const [error, setError] = useState('');

  const fetchRooms = () => {
    apiFetch<{ rooms: Room[] }>('/rooms')
      .then((res) => setRooms(res.data.rooms))
      .catch((err: unknown) => showError(err, 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchRooms, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ block: '', floor: '', roomNumber: '', hostelGender: 'BOYS', roomType: 'NORMAL', acType: 'NON_AC', totalBeds: 4, feePerSemester: 50000, photos: [] });
      fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const updateOccupancy = async (roomId: string, delta: number) => {
    const room = rooms.find((r) => r._id === roomId);
    if (!room) return;
    const newVal = room.occupiedBeds + delta;
    if (newVal < 0 || newVal > room.totalBeds) return;

    try {
      await apiFetch(`/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify({ occupiedBeds: newVal }),
      });
      setRooms((prev) =>
        prev.map((r) => (r._id === roomId ? { ...r, occupiedBeds: newVal } : r)),
      );
      showSuccess('Occupancy updated');
    } catch (err) {
      showError(err);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Room Management"
          description="Add rooms, manage occupancy and availability."
          action={
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Cancel' : '+ Add Room'}
            </button>
          }
        />
      </Reveal>

      {/* Add Room Form */}
      <AnimatePresence>
      {showForm && (
        <motion.div key="room-form" initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }} exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
        <form onSubmit={handleSubmit} className="card-glow bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
              <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Floor</label>
              <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Room Number</label>
              <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Hostel</label>
              <select value={form.hostelGender} onChange={(e) => setForm({ ...form, hostelGender: e.target.value })} className={inputCls}>
                <option value="BOYS">Boys</option>
                <option value="GIRLS">Girls</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Room Type</label>
              <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className={inputCls}>
                <option value="NORMAL">Normal</option>
                <option value="DELUXE">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">AC Type</label>
              <select value={form.acType} onChange={(e) => setForm({ ...form, acType: e.target.value })} className={inputCls}>
                <option value="NON_AC">Non-AC</option>
                <option value="AC">AC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Total Beds</label>
              <input type="number" min={1} max={10} value={form.totalBeds} onChange={(e) => setForm({ ...form, totalBeds: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Fee / Semester (INR)</label>
              <input type="number" min={0} value={form.feePerSemester} onChange={(e) => setForm({ ...form, feePerSemester: Number(e.target.value) })} className={inputCls} />
            </div>
          </div>
          {error && <ErrorBanner message={error} />}
          <button type="submit" className="w-full py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium text-sm hover:opacity-90 transition-opacity">
            Create Room
          </button>
        </form>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Room List */}
      {loading ? (
        <PageSkeleton />
      ) : rooms.length === 0 ? (
        <EmptyState title="No rooms added yet" description="Add your first room to get started." />
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const bedsLeft = room.totalBeds - room.occupiedBeds;
            return (
              <div
                key={room._id}
                className="card-glow bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 hover:border-[hsl(var(--accent))]/40 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">
                      Block {room.block} - Room {room.roomNumber}
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Floor {room.floor} | {room.hostelGender} | {room.roomType} | {room.acType === 'AC' ? 'AC' : 'Non-AC'}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      INR {room.feePerSemester.toLocaleString('en-IN')} / semester
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${bedsLeft > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {bedsLeft} bed{bedsLeft !== 1 ? 's' : ''} left
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateOccupancy(room._id, -1)}
                        disabled={room.occupiedBeds <= 0}
                        className="w-7 h-7 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-bold disabled:opacity-30 hover:bg-[hsl(var(--accent))]/20 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">{room.occupiedBeds}/{room.totalBeds}</span>
                      <button
                        onClick={() => updateOccupancy(room._id, 1)}
                        disabled={room.occupiedBeds >= room.totalBeds}
                        className="w-7 h-7 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-bold disabled:opacity-30 hover:bg-[hsl(var(--accent))]/20 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
