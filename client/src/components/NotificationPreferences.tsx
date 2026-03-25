import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, FileText, Users, Shield, CreditCard, Megaphone } from 'lucide-react';

interface Prefs {
  leaveUpdates: boolean;
  complaintUpdates: boolean;
  visitorUpdates: boolean;
  notices: boolean;
  sosAlerts: boolean;
  feeReminders: boolean;
}

const PREF_ITEMS: { key: keyof Prefs; label: string; description: string; icon: typeof Bell; critical?: boolean }[] = [
  { key: 'leaveUpdates', label: 'Leave Updates', description: 'Approval, rejection, and status changes', icon: Calendar },
  { key: 'complaintUpdates', label: 'Complaint Updates', description: 'Status changes and resolution', icon: FileText },
  { key: 'visitorUpdates', label: 'Visitor Updates', description: 'Visitor approval and check-in', icon: Users },
  { key: 'notices', label: 'Hostel Notices', description: 'Announcements from warden', icon: Megaphone },
  { key: 'sosAlerts', label: 'SOS Alerts', description: 'Emergency alerts (recommended)', icon: Shield, critical: true },
  { key: 'feeReminders', label: 'Fee Reminders', description: 'Payment due date reminders', icon: CreditCard },
];

const spring = { type: 'spring' as const, stiffness: 500, damping: 30 };

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Prefs>('/notifications/preferences')
      .then(res => setPrefs(res.data))
      .catch(() => {});
  }, []);

  const toggle = async (key: keyof Prefs) => {
    if (!prefs) return;
    const newVal = !prefs[key];
    setPrefs({ ...prefs, [key]: newVal });
    setSaving(true);
    try {
      await apiFetch('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: newVal }),
      });
      showSuccess(`${key === 'sosAlerts' ? 'SOS alerts' : PREF_ITEMS.find(p => p.key === key)?.label ?? key} ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setPrefs({ ...prefs, [key]: !newVal }); // revert
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return null;

  return (
    <div className="space-y-1">
      {PREF_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const enabled = prefs[item.key];
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              whileHover={{ x: 2, backgroundColor: 'hsl(var(--muted) / 0.3)' }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl transition-colors cursor-default"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    enabled
                      ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  }`}
                  animate={enabled ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon size={16} />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] flex items-center gap-1.5">
                    {item.label}
                    {item.critical && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
                        Critical
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.description}</p>
                </div>
              </div>

              {/* Premium toggle switch */}
              <button
                onClick={() => void toggle(item.key)}
                disabled={saving}
                aria-label={`Toggle ${item.label}`}
                className={`relative w-12 h-7 rounded-full transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                  enabled
                    ? 'bg-[hsl(var(--accent))] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]'
                    : 'bg-[hsl(var(--border))] hover:bg-[hsl(var(--muted-foreground))]/30'
                }`}
              >
                <motion.span
                  className="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md flex items-center justify-center"
                  animate={{ x: enabled ? 20 : 0 }}
                  transition={spring}
                >
                  <AnimatePresence mode="wait">
                    {enabled ? (
                      <motion.svg
                        key="check"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        width="10" height="10" viewBox="0 0 10 10" fill="none"
                      >
                        <path d="M2 5L4 7L8 3" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    ) : (
                      <motion.div
                        key="dot"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.3, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted-foreground))]"
                      />
                    )}
                  </AnimatePresence>
                </motion.span>
              </button>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
