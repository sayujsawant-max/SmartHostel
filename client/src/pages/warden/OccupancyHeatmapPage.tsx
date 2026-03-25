import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import {
  Building2,
  BedDouble,
  Users,
  TrendingDown,
  Layers,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

interface Room {
  _id?: string;
  block: string;
  floor: number;
  roomNumber: string;
  totalBeds: number;
  occupiedBeds: number;
  roomType?: string;
  acType?: string;
}

function getOccupancyStyle(percent: number) {
  if (percent >= 100)
    return {
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
      label: 'Full',
    };
  if (percent >= 75)
    return {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
      label: 'High',
    };
  if (percent >= 50)
    return {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/40',
      text: 'text-blue-600 dark:text-blue-400',
      bar: 'bg-blue-500',
      label: 'Medium',
    };
  return {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    label: 'Low',
  };
}

export default function OccupancyHeatmapPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await apiFetch('/admin/rooms');
        const data = Array.isArray(res) ? res : res.rooms ?? res.data ?? [];
        setRooms(data);
      } catch (err: any) {
        showError(err?.message ?? 'Failed to load room data');
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const blocks = useMemo(
    () => [...new Set(rooms.map((r) => r.block))].sort(),
    [rooms],
  );

  const filtered = useMemo(
    () => (selectedBlock ? rooms.filter((r) => r.block === selectedBlock) : rooms),
    [rooms, selectedBlock],
  );

  const floorsMap = useMemo(() => {
    const map = new Map<number, Room[]>();
    filtered.forEach((r) => {
      const list = map.get(r.floor) ?? [];
      list.push(r);
      map.set(r.floor, list);
    });
    return new Map([...map.entries()].sort(([a], [b]) => a - b));
  }, [filtered]);

  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupiedBeds, 0);
  const vacancyRate = totalBeds > 0 ? ((totalBeds - occupiedBeds) / totalBeds) * 100 : 0;

  if (loading) return <PageSkeleton />;

  const statCards = [
    {
      label: 'Total Rooms',
      value: totalRooms,
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/40',
    },
    {
      label: 'Total Beds',
      value: totalBeds,
      icon: BedDouble,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-950/40',
    },
    {
      label: 'Occupied Beds',
      value: occupiedBeds,
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/40',
    },
    {
      label: 'Vacancy Rate',
      value: vacancyRate,
      suffix: '%',
      decimals: 1,
      icon: TrendingDown,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Occupancy Heatmap"
        subtitle="Live room occupancy overview across all blocks"
      />

      {/* Summary Stats */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StaggerItem key={card.label}>
            <Reveal>
              <motion.div
                className="card-glow relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                whileHover={{ y: -2 }}
                transition={spring}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/25 to-transparent" />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-xl p-2.5 ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    {card.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  <AnimatedCounter
                    value={card.value}
                    decimals={card.decimals ?? 0}
                  />
                  {card.suffix ?? ''}
                </div>
              </motion.div>
            </Reveal>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Block Selector Pills */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-2">
          <Layers className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <motion.button
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedBlock === null
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedBlock(null)}
          >
            All Blocks
          </motion.button>
          {blocks.map((block) => (
            <motion.button
              key={block}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedBlock === block
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedBlock(block)}
            >
              Block {block}
            </motion.button>
          ))}
        </div>
      </Reveal>

      {/* Room Grid by Floor */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {[...floorsMap.entries()].map(([floor, floorRooms]) => (
            <motion.div
              key={`${selectedBlock ?? 'all'}-floor-${floor}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
              className="space-y-3"
            >
              <Reveal>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Floor {floor}
                </h3>
              </Reveal>

              <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {floorRooms
                  .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
                  .map((room) => {
                    const percent =
                      room.totalBeds > 0
                        ? (room.occupiedBeds / room.totalBeds) * 100
                        : 0;
                    const style = getOccupancyStyle(percent);
                    const roomKey = `${room.block}-${room.roomNumber}`;
                    const isHovered = hoveredRoom === roomKey;

                    return (
                      <StaggerItem key={roomKey}>
                        <motion.div
                          className={`relative cursor-default rounded-2xl border p-3 ${style.bg} ${style.border} transition-shadow`}
                          whileHover={{ y: -2, scale: 1.02 }}
                          transition={spring}
                          onMouseEnter={() => setHoveredRoom(roomKey)}
                          onMouseLeave={() => setHoveredRoom(null)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-bold ${style.text}`}>
                              {room.roomNumber}
                            </span>
                            <span className={`text-xs font-medium ${style.text}`}>
                              {room.occupiedBeds}/{room.totalBeds}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full rounded-full bg-[hsl(var(--muted))]">
                            <motion.div
                              className={`h-full rounded-full ${style.bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(percent, 100)}%` }}
                              transition={{ ...spring, delay: 0.1 }}
                            />
                          </div>

                          {/* Hover Tooltip */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-lg"
                              >
                                <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                                  Room {room.roomNumber}
                                </p>
                                <div className="mt-1.5 space-y-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                                  <p>Block: {room.block}</p>
                                  <p>Floor: {room.floor}</p>
                                  {room.roomType && <p>Type: {room.roomType}</p>}
                                  {room.acType && <p>AC: {room.acType}</p>}
                                  <p className={`font-medium ${style.text}`}>
                                    Occupancy: {Math.round(percent)}% ({style.label})
                                  </p>
                                </div>
                                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[hsl(var(--border))]" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
              </StaggerContainer>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <Reveal>
            <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                No rooms found for the selected block.
              </p>
            </div>
          </Reveal>
        )}
      </div>

      {/* Color Legend */}
      <Reveal>
        <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Occupancy Legend
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Full (100%)', style: getOccupancyStyle(100) },
              { label: 'High (75-99%)', style: getOccupancyStyle(80) },
              { label: 'Medium (50-74%)', style: getOccupancyStyle(60) },
              { label: 'Low (0-49%)', style: getOccupancyStyle(30) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-md border ${item.style.bg} ${item.style.border}`}
                />
                <span className={`text-xs font-medium ${item.style.text}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
