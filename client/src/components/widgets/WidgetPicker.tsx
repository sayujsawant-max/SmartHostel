import { motion, AnimatePresence } from 'motion/react';
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
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { WIDGET_REGISTRY } from './WidgetRegistry';
import type { WidgetLayout, WidgetType } from './WidgetRegistry';

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

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  layout: WidgetLayout[];
  onAddWidget: (type: WidgetType) => void;
}

export default function WidgetPicker({
  isOpen,
  onClose,
  layout,
  onAddWidget,
}: WidgetPickerProps) {
  const activeTypes = new Set(layout.map((w) => w.type));
  const availableWidgets = Object.values(WIDGET_REGISTRY).filter(
    (w) => !activeTypes.has(w.type),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(8px)' }}
            transition={spring}
            className="fixed inset-x-4 bottom-4 top-auto z-50 max-w-lg mx-auto rounded-2xl glass-strong shadow-xl p-5 max-h-[70vh] overflow-y-auto card-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Add Widget</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={spring}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {availableWidgets.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
                All widgets are already on your dashboard.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableWidgets.map((widget, i) => {
                  const Icon = ICON_MAP[widget.icon] ?? Building2;
                  return (
                    <motion.button
                      key={widget.type}
                      onClick={() => {
                        onAddWidget(widget.type);
                        onClose();
                      }}
                      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.3, delay: 0.05 * i }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]/50 hover:shadow-sm transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-[hsl(var(--primary))]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {widget.title}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {widget.description}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
