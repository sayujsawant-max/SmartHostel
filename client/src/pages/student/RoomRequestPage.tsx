import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';

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
}

export default function RoomRequestPage() {
  const { user, refreshUser } = useAuth();
  // refreshUser re-fetches /auth/me to update user state after room assignment
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hostelGender = user?.gender === 'MALE' ? 'BOYS' : 'GIRLS';

  useEffect(() => {
    apiFetch<{ rooms: Room[] }>(`/rooms?hostelGender=${hostelGender}`)
      .then((res) => {
        const available = res.data.rooms.filter((r) => r.occupiedBeds < r.totalBeds);
        setRooms(available);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hostelGender]);

  async function handleRequest(roomId: string) {
    setRequesting(roomId);
    setError('');
    try {
      await apiFetch('/rooms/request', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
      setSuccess(true);
      await refreshUser();
      setTimeout(() => navigate('/student/status'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request room');
    } finally {
      setRequesting(null);
    }
  }

  if (user?.roomNumber) {
    return (
      <div className="p-4 text-center">
        <p className="text-[hsl(var(--foreground))] font-medium">You already have a room assigned.</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Block {user.block} · Floor {user.floor} · Room {user.roomNumber}
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading available rooms...</div>;
  }

  if (success) {
    return (
      <div className="p-4 text-center">
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-green-800 font-semibold">Room assigned successfully!</p>
          <p className="text-green-600 text-sm mt-1">Redirecting to your status page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Request a Room</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Browse available rooms and pick one to request.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
          <p>No rooms available at the moment.</p>
          <p className="text-sm mt-1">Please check back later or contact the warden.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room) => {
            const availableBeds = room.totalBeds - room.occupiedBeds;
            return (
              <div
                key={room._id}
                className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[hsl(var(--foreground))]">
                    Room {room.roomNumber}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {availableBeds} bed{availableBeds !== 1 ? 's' : ''} free
                  </span>
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-0.5">
                  <p>Block {room.block} · Floor {room.floor}</p>
                  <p>{room.roomType} · {room.acType.replace('_', ' ')}</p>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    Rs. {room.feePerSemester.toLocaleString('en-IN')} / semester
                  </p>
                </div>
                <button
                  onClick={() => handleRequest(room._id)}
                  disabled={requesting !== null}
                  className="w-full mt-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {requesting === room._id ? 'Requesting...' : 'Request This Room'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
