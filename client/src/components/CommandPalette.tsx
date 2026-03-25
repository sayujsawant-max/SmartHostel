import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@context/ThemeContext';
import { Role } from '@smarthostel/shared';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Home, FileText, Calendar, Shield, UtensilsCrossed, Users,
  Settings, Bell, BarChart3, Bed, ClipboardList, MessageSquare,
  Sun, Moon, Monitor, Clock, QrCode, AlertTriangle, Package,
  ArrowRightLeft, HelpCircle, LogOut, Shirt, CreditCard, Command,
  Map, PieChart, HeartPulse, FileBarChart, AlertOctagon, Star,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  section: string;
}

const spring = { type: 'spring' as const, stiffness: 500, damping: 32 };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Theme commands (always available)
    items.push(
      { id: 'theme-light', label: 'Light Mode', icon: <Sun size={16} />, action: () => { setTheme('light'); setOpen(false); }, keywords: ['theme', 'bright'], section: 'Theme' },
      { id: 'theme-dark', label: 'Dark Mode', icon: <Moon size={16} />, action: () => { setTheme('dark'); setOpen(false); }, keywords: ['theme', 'night'], section: 'Theme' },
      { id: 'theme-system', label: 'System Theme', icon: <Monitor size={16} />, action: () => { setTheme('system'); setOpen(false); }, keywords: ['theme', 'auto'], section: 'Theme' },
      { id: 'theme-scheduled', label: 'Scheduled (7PM-6AM)', icon: <Clock size={16} />, action: () => { setTheme('scheduled'); setOpen(false); }, keywords: ['theme', 'schedule', 'auto', 'time'], section: 'Theme' },
    );

    if (!user) return items;

    // Logout
    items.push({ id: 'logout', label: 'Sign Out', icon: <LogOut size={16} />, action: () => { logout(); setOpen(false); }, keywords: ['logout', 'sign out', 'exit'], section: 'Account' });

    if (user.role === Role.STUDENT) {
      items.push(
        { id: 'student-home', label: 'Dashboard', description: 'View your status overview', icon: <Home size={16} />, action: () => go('/student/status'), keywords: ['home', 'dashboard', 'status'], section: 'Navigate' },
        { id: 'student-actions', label: 'Actions', description: 'Quick action hub', icon: <ClipboardList size={16} />, action: () => go('/student/actions'), keywords: ['actions', 'quick'], section: 'Navigate' },
        { id: 'student-qr', label: 'Show QR Code', description: 'Gate pass QR', icon: <QrCode size={16} />, action: () => go('/student/actions/show-qr'), keywords: ['qr', 'gate', 'pass'], section: 'Navigate' },
        { id: 'student-leave', label: 'Request Leave', description: 'Apply for day outing or overnight', icon: <Calendar size={16} />, action: () => go('/student/actions/request-leave'), keywords: ['leave', 'outing', 'overnight'], section: 'Actions' },
        { id: 'student-complaint', label: 'Report Issue', description: 'File a maintenance complaint', icon: <AlertTriangle size={16} />, action: () => go('/student/actions/report-issue'), keywords: ['complaint', 'issue', 'report', 'problem'], section: 'Actions' },
        { id: 'student-visitor', label: 'Register Visitor', description: 'Pre-register a visitor', icon: <Users size={16} />, action: () => go('/student/visitors'), keywords: ['visitor', 'guest'], section: 'Actions' },
        { id: 'student-room-change', label: 'Room Change', description: 'Request a room transfer', icon: <ArrowRightLeft size={16} />, action: () => go('/student/room-change'), keywords: ['room', 'change', 'transfer'], section: 'Actions' },
        { id: 'student-lost-found', label: 'Lost & Found', description: 'Report or claim items', icon: <Package size={16} />, action: () => go('/student/lost-found'), keywords: ['lost', 'found', 'item'], section: 'Navigate' },
        { id: 'student-mess', label: 'Mess Menu', description: 'View today\'s meals', icon: <UtensilsCrossed size={16} />, action: () => go('/student/mess-menu'), keywords: ['mess', 'food', 'menu', 'meal'], section: 'Navigate' },
        { id: 'student-laundry', label: 'Laundry Booking', description: 'Book a washing machine', icon: <Shirt size={16} />, action: () => go('/student/laundry'), keywords: ['laundry', 'washing', 'machine'], section: 'Navigate' },
        { id: 'student-fees', label: 'Fees & Payments', description: 'View fees and download receipts', icon: <CreditCard size={16} />, action: () => go('/student/fees'), keywords: ['fee', 'payment', 'receipt'], section: 'Navigate' },
        { id: 'student-profile', label: 'My Profile', description: 'View and edit your profile', icon: <Users size={16} />, action: () => go('/student/profile'), keywords: ['profile', 'account', 'settings'], section: 'Navigate' },
        { id: 'student-faq', label: 'FAQ / Help', description: 'Frequently asked questions', icon: <HelpCircle size={16} />, action: () => go('/student/faq'), keywords: ['faq', 'help', 'question'], section: 'Navigate' },
        { id: 'student-meal-pref', label: 'Meal Preferences', description: 'Set dietary preferences', icon: <UtensilsCrossed size={16} />, action: () => go('/student/meal-preferences'), keywords: ['meal', 'diet', 'food', 'preference'], section: 'Navigate' },
        { id: 'student-leave-tracker', label: 'Leave Tracker', description: 'Track leave quota & attendance', icon: <Calendar size={16} />, action: () => go('/student/leave-tracker'), keywords: ['leave', 'quota', 'attendance', 'tracker'], section: 'Navigate' },
        { id: 'student-leaderboard', label: 'Leaderboard', description: 'Student rankings & achievements', icon: <BarChart3 size={16} />, action: () => go('/student/leaderboard'), keywords: ['leaderboard', 'rank', 'points', 'gamification'], section: 'Navigate' },
        { id: 'student-documents', label: 'Documents', description: 'Manage uploaded documents', icon: <FileText size={16} />, action: () => go('/student/documents'), keywords: ['document', 'upload', 'certificate'], section: 'Navigate' },
        { id: 'student-payments', label: 'Online Payments', description: 'Pay fees with Razorpay', icon: <CreditCard size={16} />, action: () => go('/student/payments'), keywords: ['pay', 'razorpay', 'online', 'payment'], section: 'Navigate' },
        { id: 'student-chat', label: 'Messages', description: 'Chat with warden', icon: <MessageSquare size={16} />, action: () => go('/student/chat'), keywords: ['chat', 'message', 'warden', 'conversation'], section: 'Navigate' },
        { id: 'student-feedback', label: 'Feedback & Ratings', description: 'Rate hostel services', icon: <Star size={16} />, action: () => go('/student/feedback'), keywords: ['feedback', 'rate', 'review', 'rating'], section: 'Navigate' },
      );
    }

    if (user.role === Role.WARDEN_ADMIN) {
      items.push(
        { id: 'warden-dashboard', label: 'Dashboard', description: 'Overview & analytics', icon: <Home size={16} />, action: () => go('/warden/dashboard'), keywords: ['home', 'dashboard'], section: 'Navigate' },
        { id: 'warden-students', label: 'Leave Management', description: 'Approve or reject leaves', icon: <Calendar size={16} />, action: () => go('/warden/students'), keywords: ['leave', 'approve', 'students'], section: 'Navigate' },
        { id: 'warden-complaints', label: 'Complaints', description: 'Manage complaints', icon: <FileText size={16} />, action: () => go('/warden/complaints'), keywords: ['complaint', 'issue'], section: 'Navigate' },
        { id: 'warden-notices', label: 'Notices', description: 'Create hostel notices', icon: <Bell size={16} />, action: () => go('/warden/notices'), keywords: ['notice', 'announcement'], section: 'Navigate' },
        { id: 'warden-rooms', label: 'Rooms Management', description: 'Manage room inventory', icon: <Bed size={16} />, action: () => go('/warden/rooms'), keywords: ['room', 'bed', 'occupancy'], section: 'Navigate' },
        { id: 'warden-users', label: 'User Management', description: 'Create and manage staff', icon: <Users size={16} />, action: () => go('/warden/users'), keywords: ['user', 'staff', 'guard', 'maintenance'], section: 'Navigate' },
        { id: 'warden-visitors', label: 'Visitor Management', description: 'Approve visitor registrations', icon: <Shield size={16} />, action: () => go('/warden/visitors'), keywords: ['visitor', 'guest', 'approve'], section: 'Navigate' },
        { id: 'warden-room-changes', label: 'Room Changes', description: 'Manage room change requests', icon: <ArrowRightLeft size={16} />, action: () => go('/warden/room-changes'), keywords: ['room', 'change', 'transfer'], section: 'Navigate' },
        { id: 'warden-mess', label: 'Mess Menu', description: 'Configure weekly menus', icon: <UtensilsCrossed size={16} />, action: () => go('/warden/mess-menu'), keywords: ['mess', 'food', 'menu'], section: 'Navigate' },
        { id: 'warden-reports', label: 'Reports', description: 'Generate analytics reports', icon: <BarChart3 size={16} />, action: () => go('/warden/reports'), keywords: ['report', 'analytics', 'data'], section: 'Navigate' },
        { id: 'warden-settings', label: 'Settings', description: 'System configuration', icon: <Settings size={16} />, action: () => go('/warden/settings'), keywords: ['settings', 'config'], section: 'Navigate' },
        { id: 'warden-kpi', label: 'KPI Dashboard', description: 'Key performance indicators', icon: <BarChart3 size={16} />, action: () => go('/warden/kpi'), keywords: ['kpi', 'metrics', 'performance'], section: 'Navigate' },
        { id: 'warden-inspections', label: 'Inspections', description: 'Room inspection records', icon: <ClipboardList size={16} />, action: () => go('/warden/inspections'), keywords: ['inspection', 'room', 'check'], section: 'Navigate' },
        { id: 'warden-communications', label: 'Bulk Communications', description: 'Send targeted announcements', icon: <MessageSquare size={16} />, action: () => go('/warden/communications'), keywords: ['bulk', 'announce', 'communicate', 'broadcast'], section: 'Navigate' },
        { id: 'warden-audit', label: 'Audit Trail', description: 'System activity log', icon: <Shield size={16} />, action: () => go('/warden/audit-trail'), keywords: ['audit', 'log', 'trail', 'activity'], section: 'Navigate' },
        { id: 'warden-heatmap', label: 'Occupancy Heatmap', description: 'Live room occupancy map', icon: <Map size={16} />, action: () => go('/warden/occupancy-heatmap'), keywords: ['heatmap', 'occupancy', 'map', 'rooms', 'live'], section: 'Navigate' },
        { id: 'warden-complaint-analytics', label: 'Complaint Analytics', description: 'Predictive complaint trends', icon: <PieChart size={16} />, action: () => go('/warden/complaint-analytics'), keywords: ['complaint', 'analytics', 'predict', 'trend'], section: 'Navigate' },
        { id: 'warden-wellness', label: 'Wellness Dashboard', description: 'Student wellness monitoring', icon: <HeartPulse size={16} />, action: () => go('/warden/wellness'), keywords: ['wellness', 'health', 'risk', 'student', 'monitoring'], section: 'Navigate' },
        { id: 'warden-report-builder', label: 'Report Builder', description: 'Custom report generator', icon: <FileBarChart size={16} />, action: () => go('/warden/report-builder'), keywords: ['report', 'builder', 'custom', 'generate', 'analytics'], section: 'Navigate' },
        { id: 'warden-emergency', label: 'Emergency Alerts', description: 'Send emergency broadcasts', icon: <AlertOctagon size={16} />, action: () => go('/warden/emergency'), keywords: ['emergency', 'alert', 'sos', 'broadcast', 'fire', 'security'], section: 'Navigate' },
      );
    }

    if (user.role === Role.GUARD) {
      items.push(
        { id: 'guard-scan', label: 'Scan QR', description: 'Validate gate passes', icon: <QrCode size={16} />, action: () => go('/guard/scan'), keywords: ['scan', 'qr', 'gate'], section: 'Navigate' },
        { id: 'guard-visitors', label: 'Visitor Check', description: 'Check in/out visitors', icon: <Users size={16} />, action: () => go('/guard/visitors'), keywords: ['visitor', 'check'], section: 'Navigate' },
        { id: 'guard-analytics', label: 'Gate Analytics', description: 'Entry/exit patterns & metrics', icon: <BarChart3 size={16} />, action: () => go('/guard/analytics'), keywords: ['analytics', 'gate', 'stats', 'traffic'], section: 'Navigate' },
      );
    }

    if (user.role === Role.MAINTENANCE) {
      items.push(
        { id: 'maint-tasks', label: 'My Tasks', description: 'View assigned work orders', icon: <ClipboardList size={16} />, action: () => go('/maintenance/tasks'), keywords: ['task', 'work', 'assigned'], section: 'Navigate' },
        { id: 'maint-history', label: 'History', description: 'Completed tasks', icon: <FileText size={16} />, action: () => go('/maintenance/history'), keywords: ['history', 'completed'], section: 'Navigate' },
        { id: 'maint-faq', label: 'FAQ', description: 'Help & guides', icon: <HelpCircle size={16} />, action: () => go('/maintenance/faq'), keywords: ['faq', 'help'], section: 'Navigate' },
        { id: 'maint-inventory', label: 'Parts Inventory', description: 'Track supplies & spare parts', icon: <Package size={16} />, action: () => go('/maintenance/inventory'), keywords: ['inventory', 'parts', 'stock', 'supplies'], section: 'Navigate' },
        { id: 'maint-assets', label: 'Asset Tracking', description: 'QR-based asset management', icon: <QrCode size={16} />, action: () => go('/maintenance/assets'), keywords: ['asset', 'qr', 'tracking', 'equipment', 'furniture'], section: 'Navigate' },
      );
    }

    return items;
  }, [user, go, logout, setTheme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.some(k => k.includes(q))
    );
  }, [commands, query]);

  // Group by section
  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const arr = map.get(item.section) || [];
      arr.push(item);
      map.set(item.section, arr);
    }
    return map;
  }, [filtered]);

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      // Quick shortcuts (only when palette is closed)
      if (!open && user) {
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          e.preventDefault();
          setOpen(true);
          setQuery('');
          setSelectedIndex(0);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, user]);

  // Navigate filtered list with arrow keys
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: -12, filter: 'blur(8px)' }}
            transition={spring}
            className="fixed left-1/2 top-[12%] z-[101] w-full max-w-lg -translate-x-1/2 rounded-2xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[hsl(var(--border))]">
              <motion.div
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.1, ...spring }}
              >
                <Search size={18} className="text-[hsl(var(--accent))] shrink-0" />
              </motion.div>
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands, pages..."
                className="flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-md border border-[hsl(var(--border))]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 scroll-smooth">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  className="py-10 text-center"
                >
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mt-1">
                    Try a different search term
                  </p>
                </motion.div>
              ) : (
                Array.from(sections.entries()).map(([section, items]) => (
                  <div key={section} className="mb-1">
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]/70">
                      {section}
                    </div>
                    {items.map(item => {
                      flatIndex++;
                      const isSelected = flatIndex === selectedIndex;
                      const idx = flatIndex;
                      return (
                        <motion.button
                          key={item.id}
                          data-selected={isSelected}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] shadow-sm'
                              : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50'
                          }`}
                        >
                          <motion.span
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]'
                                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                            }`}
                            animate={isSelected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {item.icon}
                          </motion.span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.label}</div>
                            {item.description && (
                              <div className={`text-xs truncate transition-colors ${isSelected ? 'text-[hsl(var(--accent))]/60' : 'text-[hsl(var(--muted-foreground))]'}`}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.kbd
                                initial={{ opacity: 0, x: 4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 4 }}
                                className="text-[10px] text-[hsl(var(--accent))]/60 px-1.5 py-0.5 rounded bg-[hsl(var(--accent))]/5"
                              >
                                Enter
                              </motion.kbd>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
              <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[hsl(var(--muted))] rounded text-[9px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[hsl(var(--muted))] rounded text-[9px]">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[hsl(var(--muted))] rounded text-[9px]">Esc</kbd>
                  Close
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                <Command size={10} />
                <span>K</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
