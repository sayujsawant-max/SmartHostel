import { useEffect, useState } from 'react';

const LOG_PREFIX = '[RoomsPage]';

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

interface Availability {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  byHostel: Record<string, { total: number; occupied: number; available: number }>;
  byType: Record<string, { total: number; occupied: number; available: number }>;
}

const HOSTEL_BG: Record<string, string> = {
  BOYS: 'from-blue-500 to-blue-700',
  GIRLS: 'from-pink-500 to-pink-700',
};

const ROOM_PHOTOS: Record<string, string> = {
  DELUXE_AC: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=250&fit=crop',
  DELUXE_NON_AC: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=250&fit=crop',
  NORMAL_AC: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop',
  NORMAL_NON_AC: 'https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=400&h=250&fit=crop',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAc, setFilterAc] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterGender) params.set('hostelGender', filterGender);
    if (filterType) params.set('roomType', filterType);
    if (filterAc) params.set('acType', filterAc);

    setError(null);
    Promise.all([
      fetch(`/api/rooms?${params}`).then((r) => r.json()),
      fetch('/api/rooms/availability').then((r) => r.json()),
    ])
      .then(([roomsRes, availRes]) => {
        setRooms(roomsRes.data?.rooms ?? []);
        setAvailability(availRes.data?.availability ?? null);
      })
      .catch((err) => {
        console.error(LOG_PREFIX, 'Failed to load rooms', err);
        setError('Failed to load room data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [filterGender, filterType, filterAc]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, hsl(222 47% 19%) 0%, hsl(210 40% 98%) 30%)',
      }}
    >
      {/* Hero */}
      <div className="text-center pt-12 pb-8 px-4">
        <h1 className="text-3xl font-bold text-white">SmartHostel Rooms</h1>
        <p className="text-white/70 mt-2">Browse rooms, check availability & fees</p>
      </div>

      {/* Availability Summary */}
      {availability && (
        <div className="max-w-4xl mx-auto px-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 shadow text-center">
              <p className="text-2xl font-bold text-teal-700">{availability.availableBeds}</p>
              <p className="text-xs text-gray-500">Beds Available</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow text-center">
              <p className="text-2xl font-bold text-gray-700">{availability.totalBeds}</p>
              <p className="text-xs text-gray-500">Total Beds</p>
            </div>
            {Object.entries(availability.byHostel).map(([key, val]) => (
              <div key={key} className="bg-white rounded-xl p-4 shadow text-center">
                <p className="text-2xl font-bold text-blue-700">{val.available}</p>
                <p className="text-xs text-gray-500">{key} Hostel Available</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow flex flex-wrap gap-3">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            <option value="">All Hostels</option>
            <option value="BOYS">Boys Hostel</option>
            <option value="GIRLS">Girls Hostel</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            <option value="">All Room Types</option>
            <option value="DELUXE">Deluxe</option>
            <option value="NORMAL">Normal</option>
          </select>
          <select
            value={filterAc}
            onChange={(e) => setFilterAc(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            <option value="">AC & Non-AC</option>
            <option value="AC">AC Only</option>
            <option value="NON_AC">Non-AC Only</option>
          </select>
        </div>
      </div>

      {/* Room Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading rooms...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No rooms match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const bedsLeft = room.totalBeds - room.occupiedBeds;
              const photoKey = `${room.roomType}_${room.acType}`;
              const photo = room.photos[0] || ROOM_PHOTOS[photoKey] || ROOM_PHOTOS.NORMAL_NON_AC;

              return (
                <div key={room._id} className="bg-white rounded-xl shadow overflow-hidden">
                  {/* Room Image */}
                  <div className="relative h-40">
                    <img
                      src={photo}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${HOSTEL_BG[room.hostelGender] || 'from-gray-500 to-gray-700'}`}>
                      {room.hostelGender} Hostel
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.acType === 'AC' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                        {room.acType === 'AC' ? 'AC' : 'Non-AC'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.roomType === 'DELUXE' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                        {room.roomType}
                      </span>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Block {room.block} - Room {room.roomNumber}
                        </h3>
                        <p className="text-xs text-gray-500">Floor {room.floor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-700">
                          INR {room.feePerSemester.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-500">per semester</p>
                      </div>
                    </div>

                    {/* Availability Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-medium ${bedsLeft > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {bedsLeft > 0 ? `${bedsLeft} bed${bedsLeft > 1 ? 's' : ''} left` : 'Full'}
                        </span>
                        <span className="text-gray-500">{room.occupiedBeds}/{room.totalBeds} occupied</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${bedsLeft > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${(room.occupiedBeds / room.totalBeds) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back to Login */}
      <div className="text-center pb-8">
        <a href="/login" className="text-teal-600 hover:underline text-sm">
          Back to Login
        </a>
        {' | '}
        <a href="/register" className="text-teal-600 hover:underline text-sm">
          Create Account
        </a>
      </div>
    </div>
  );
}
