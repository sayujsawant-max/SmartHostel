export type WidgetType =
  | 'occupancy-summary'
  | 'complaint-status'
  | 'recent-notices'
  | 'fee-collection'
  | 'leave-requests'
  | 'maintenance-tasks'
  | 'visitor-log'
  | 'wellness-alerts';

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetConfig> = {
  'occupancy-summary': {
    type: 'occupancy-summary',
    title: 'Occupancy Summary',
    description: 'Room occupancy overview with vacancy stats',
    icon: 'Building2',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  'complaint-status': {
    type: 'complaint-status',
    title: 'Complaint Status',
    description: 'Open, in-progress, and resolved complaint counts',
    icon: 'AlertCircle',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  'recent-notices': {
    type: 'recent-notices',
    title: 'Recent Notices',
    description: 'Latest notices posted to the hostel',
    icon: 'Bell',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
  },
  'fee-collection': {
    type: 'fee-collection',
    title: 'Fee Collection',
    description: 'Fee collection progress and pending amounts',
    icon: 'CreditCard',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  'leave-requests': {
    type: 'leave-requests',
    title: 'Leave Requests',
    description: 'Pending leave requests from students',
    icon: 'CalendarDays',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
  },
  'maintenance-tasks': {
    type: 'maintenance-tasks',
    title: 'Maintenance Tasks',
    description: 'Task summary with priority breakdown',
    icon: 'Wrench',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  'visitor-log': {
    type: 'visitor-log',
    title: 'Visitor Log',
    description: 'Today\'s visitor activity and check-in status',
    icon: 'Eye',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
  },
  'wellness-alerts': {
    type: 'wellness-alerts',
    title: 'Wellness Alerts',
    description: 'At-risk student monitoring and alerts',
    icon: 'HeartPulse',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
  },
};

export interface WidgetLayout {
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  isVisible: boolean;
}

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  { type: 'occupancy-summary', position: { x: 0, y: 0, w: 2, h: 1 }, isVisible: true },
  { type: 'complaint-status', position: { x: 2, y: 0, w: 2, h: 1 }, isVisible: true },
  { type: 'recent-notices', position: { x: 0, y: 1, w: 2, h: 1 }, isVisible: true },
  { type: 'fee-collection', position: { x: 2, y: 1, w: 2, h: 1 }, isVisible: true },
  { type: 'leave-requests', position: { x: 0, y: 2, w: 2, h: 1 }, isVisible: true },
  { type: 'maintenance-tasks', position: { x: 2, y: 2, w: 2, h: 1 }, isVisible: true },
  { type: 'visitor-log', position: { x: 0, y: 3, w: 2, h: 1 }, isVisible: true },
  { type: 'wellness-alerts', position: { x: 2, y: 3, w: 2, h: 1 }, isVisible: true },
];
