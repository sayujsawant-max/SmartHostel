import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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
      .catch(() => {})
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
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Room Management</h2>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">Add rooms, manage occupancy and availability.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Room'}
        </button>
      </div>

      {/* Add Room Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Block</label>
              <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Floor</label>
              <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Room Number</label>
              <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Hostel</label>
              <select value={form.hostelGender} onChange={(e) => setForm({ ...form, hostelGender: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm">
                <option value="BOYS">Boys</option>
                <option value="GIRLS">Girls</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Room Type</label>
              <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm">
                <option value="NORMAL">Normal</option>
                <option value="DELUXE">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">AC Type</label>
              <select value={form.acType} onChange={(e) => setForm({ ...form, acType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm">
                <option value="NON_AC">Non-AC</option>
                <option value="AC">AC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Total Beds</label>
              <input type="number" min={1} max={10} value={form.totalBeds} onChange={(e) => setForm({ ...form, totalBeds: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Fee / Semester (INR)</label>
              <input type="number" min={0} value={form.feePerSemester} onChange={(e) => setForm({ ...form, feePerSemester: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium text-sm">
            Create Room
          </button>
        </form>
      )}

      {/* Room List */}
      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <p>No rooms added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const bedsLeft = room.totalBeds - room.occupiedBeds;
            return (
              <div key={room._id} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4">
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
                        className="w-7 h-7 rounded bg-gray-200 text-gray-700 text-sm font-bold disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium">{room.occupiedBeds}/{room.totalBeds}</span>
                      <button
                        onClick={() => updateOccupancy(room._id, 1)}
                        disabled={room.occupiedBeds >= room.totalBeds}
                        className="w-7 h-7 rounded bg-gray-200 text-gray-700 text-sm font-bold disabled:opacity-30"
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
