import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { WIDGET_REGISTRY } from './WidgetRegistry';
import type { WidgetLayout, WidgetType } from './WidgetRegistry';
import WidgetCard from './WidgetCard';
import { Plus, RotateCcw, Pencil, Check } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

/* ── Lazy-loaded widget components ────────────────────────────── */
const widgetComponents: Record<WidgetType, React.LazyExoticComponent<React.ComponentType>> = {
  'occupancy-summary': lazy(() => import('./widgets/OccupancySummaryWidget')),
  'complaint-status': lazy(() => import('./widgets/ComplaintStatusWidget')),
  'recent-notices': lazy(() => import('./widgets/RecentNoticesWidget')),
  'fee-collection': lazy(() => import('./widgets/FeeCollectionWidget')),
  'leave-requests': lazy(() => import('./widgets/LeaveRequestsWidget')),
  'maintenance-tasks': lazy(() => import('./widgets/MaintenanceTasksWidget')),
  'visitor-log': lazy(() => import('./widgets/VisitorLogWidget')),
  'wellness-alerts': lazy(() => import('./widgets/WellnessAlertsWidget')),
};

function WidgetSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-24 rounded bg-[hsl(var(--muted))]" />
      <div className="h-4 w-32 rounded bg-[hsl(var(--muted))]" />
      <div className="h-3 w-full rounded bg-[hsl(var(--muted))]" />
    </div>
  );
}

interface WidgetGridProps {
  layout: WidgetLayout[];
  onLayoutChange: (layout: WidgetLayout[]) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onOpenPicker: () => void;
  onReset: () => void;
  onRemoveWidget: (type: WidgetType) => void;
}

export default function WidgetGrid({
  layout,
  isEditing,
  onToggleEdit,
  onOpenPicker,
  onReset,
  onRemoveWidget,
}: WidgetGridProps) {
  const visibleWidgets = layout.filter((w) => w.isVisible);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Widgets</h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <motion.button
                onClick={onOpenPicker}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Widget
              </motion.button>
              <motion.button
                onClick={onReset}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </motion.button>
            </>
          )}
          <motion.button
            onClick={onToggleEdit}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              isEditing
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Done
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" />
                Customize
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Grid */}
      <StaggerContainer
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        stagger={0.06}
      >
        <AnimatePresence mode="popLayout">
          {visibleWidgets.map((widget) => {
            const config = WIDGET_REGISTRY[widget.type];
            const Component = widgetComponents[widget.type];
            const colSpan =
              widget.position.w >= 3
                ? 'lg:col-span-3'
                : widget.position.w === 2
                  ? 'lg:col-span-2'
                  : 'lg:col-span-1';

            return (
              <StaggerItem
                key={widget.type}
                className={`md:col-span-1 ${colSpan}`}
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={spring}
                >
                  <WidgetCard
                    type={widget.type}
                    title={config.title}
                    icon={config.icon}
                    isEditing={isEditing}
                    onRemove={() => onRemoveWidget(widget.type)}
                  >
                    <Suspense fallback={<WidgetSkeleton />}>
                      <Component />
                    </Suspense>
                  </WidgetCard>
                </motion.div>
              </StaggerItem>
            );
          })}
        </AnimatePresence>
      </StaggerContainer>

      {visibleWidgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 text-center"
        >
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No widgets added. Click "Customize" to add widgets to your dashboard.
          </p>
        </motion.div>
      )}
    </div>
  );
}
