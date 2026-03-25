import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  AlertCircle,
  Bell,
  CreditCard,
  CalendarDays,
  Wrench,
  Eye,
  HeartPulse,
  X,
  GripVertical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  AlertCircle,
  Bell,
  CreditCard,
  CalendarDays,
  Wrench,
  Eye,
  HeartPulse,
};

interface WidgetCardProps {
  type: string;
  title: string;
  icon: string;
  children: ReactNode;
  onRemove?: () => void;
  isEditing?: boolean;
}

export default function WidgetCard({
  title,
  icon,
  children,
  onRemove,
  isEditing = false,
}: WidgetCardProps) {
  const Icon = ICON_MAP[icon] ?? Building2;

  return (
    <motion.div
      layout
      transition={spring}
      whileHover={isEditing ? undefined : { y: -2 }}
      className={`
        rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]
        hover:shadow-md transition-shadow overflow-hidden card-glow
        ${isEditing ? 'ring-2 ring-[hsl(var(--primary))]/30 ring-dashed' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="cursor-grab active:cursor-grabbing text-[hsl(var(--muted-foreground))]"
            >
              <GripVertical className="w-4 h-4" />
            </motion.div>
          )}
          <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[hsl(var(--primary))]" />
          </div>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</h3>
        </div>
        {isEditing && onRemove && (
          <motion.button
            onClick={onRemove}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={spring}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
      {/* Content */}
      <div className="px-4 pb-4">{children}</div>
    </motion.div>
  );
}
