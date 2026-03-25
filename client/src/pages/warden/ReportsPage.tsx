import { useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { exportToCSV } from '@utils/csv-export';
import {
  generateOccupancyReport,
  generateComplaintsReport,
  generateFeeCollectionReport,
  generateLeaveReport,
  type OccupancyRoom,
  type ComplaintRow,
  type FeeCollectionData,
  type LeaveRow,
} from '@utils/report-generator';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { FileText, Download, FileSpreadsheet, Building2, MessageSquare, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

type ExportFormat = 'pdf' | 'csv';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  iconClass: string;
  bgClass: string;
  generatePdf: () => Promise<void>;
  generateCsv: () => Promise<void>;
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function ReportsPage() {
  usePageTitle('Reports');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const handleGenerate = async (report: ReportCard) => {
    setLoadingId(report.id);
    try {
      if (format === 'csv') {
        await report.generateCsv();
      } else {
        await report.generatePdf();
      }
      setLastGenerated(report.id);
      setTimeout(() => setLastGenerated(null), 2000);
    } catch (err) {
      showError(err, 'Failed to generate report');
    } finally {
      setLoadingId(null);
    }
  };

  const reports: ReportCard[] = [
    {
      id: 'occupancy',
      title: 'Occupancy Report',
      description: 'Room-wise occupancy breakdown with block totals, bed counts, and occupancy percentages.',
      icon: Building2,
      iconClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-100 dark:bg-blue-950/40',
      generatePdf: async () => {
        const res = await apiFetch<{ rooms: OccupancyRoom[] }>('/rooms');
        generateOccupancyReport(res.data.rooms);
      },
      generateCsv: async () => {
        const res = await apiFetch<{ rooms: OccupancyRoom[] }>('/rooms');
        const rows = res.data.rooms.map(r => [
          r.block, r.roomNumber, r.roomType, r.acType,
          r.totalBeds, r.occupiedBeds, r.totalBeds - r.occupiedBeds,
          r.totalBeds > 0 ? `${((r.occupiedBeds / r.totalBeds) * 100).toFixed(1)}%` : '0%',
        ]);
        exportToCSV('occupancy-report', ['Block', 'Room', 'Type', 'AC', 'Total Beds', 'Occupied', 'Available', 'Occupancy %'], rows);
      },
    },
    {
      id: 'complaints',
      title: 'Complaints Report',
      description: 'All complaints with category, priority, status, and average resolution time.',
      icon: MessageSquare,
      iconClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-950/40',
      generatePdf: async () => {
        const res = await apiFetch<{ complaints: ComplaintRow[] }>('/complaints');
        generateComplaintsReport(res.data.complaints);
      },
      generateCsv: async () => {
        const res = await apiFetch<{ complaints: ComplaintRow[] }>('/complaints');
        const rows = res.data.complaints.map(c => [
          c._id.slice(-6).toUpperCase(), c.category, c.status, c.priority,
          c.studentId?.name ?? 'N/A',
          new Date(c.createdAt).toLocaleDateString(),
          c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '',
        ]);
        exportToCSV('complaints-report', ['ID', 'Category', 'Status', 'Priority', 'Student', 'Created', 'Resolved'], rows);
      },
    },
    {
      id: 'fees',
      title: 'Fee Collection Report',
      description: 'Fee collection summary with total collected, pending amounts, and collection rate.',
      icon: CreditCard,
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-950/40',
      generatePdf: async () => {
        const res = await apiFetch<FeeCollectionData>('/admin/analytics');
        generateFeeCollectionReport(res.data);
      },
      generateCsv: async () => {
        const res = await apiFetch<FeeCollectionData>('/admin/analytics');
        const d = res.data;
        const rows = d.occupancy.byBlock.map(b => {
          const blockCollected = d.fees.totalCollected * (b.total > 0 ? b.occupied / d.occupancy.occupiedBeds : 0);
          return [b.block, 'Hostel Fee', `₹${blockCollected.toFixed(0)}`, b.occupied, b.total];
        });
        exportToCSV('fee-collection-report', ['Block', 'Fee Type', 'Amount', 'Occupied', 'Total'], rows);
      },
    },
    {
      id: 'leaves',
      title: 'Leave Summary Report',
      description: 'Student leave records with type, dates, approval status, and summary by status.',
      icon: Calendar,
      iconClass: 'text-violet-600 dark:text-violet-400',
      bgClass: 'bg-violet-100 dark:bg-violet-950/40',
      generatePdf: async () => {
        const res = await apiFetch<{ leaves: LeaveRow[] }>('/leaves');
        generateLeaveReport(res.data.leaves);
      },
      generateCsv: async () => {
        const res = await apiFetch<{ leaves: LeaveRow[] }>('/leaves');
        const rows = res.data.leaves.map(l => [
          l.studentId?.name ?? 'N/A', l.type,
          new Date(l.startDate).toLocaleDateString(),
          new Date(l.endDate).toLocaleDateString(),
          l.status, l.approvedBy?.name ?? '',
        ]);
        exportToCSV('leave-summary-report', ['Student', 'Type', 'Start', 'End', 'Status', 'Approved By'], rows);
      },
    },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Reports & Export" description="Generate PDF reports or export data as CSV" />
      </Reveal>

      {/* Format Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex gap-2"
      >
        {(['pdf', 'csv'] as ExportFormat[]).map(f => (
          <motion.button
            key={f}
            onClick={() => setFormat(f)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              format === f
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/70'
            }`}
          >
            {f === 'pdf' ? <FileText size={13} /> : <FileSpreadsheet size={13} />}
            {f.toUpperCase()}
            {format === f && (
              <motion.div
                layoutId="report-format-indicator"
                className="absolute inset-0 rounded-xl bg-[hsl(var(--accent))] -z-10"
                transition={spring}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Report Cards */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2" stagger={0.08}>
        {reports.map(report => {
          const Icon = report.icon;
          const isLoading = loadingId === report.id;
          const justGenerated = lastGenerated === report.id;

          return (
            <StaggerItem key={report.id}>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                transition={spring}
                className="relative overflow-hidden p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:shadow-md hover:border-[hsl(var(--accent))]/25 transition-all duration-200 card-glow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />

                <div className="flex items-start gap-3 mb-3">
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className={`w-10 h-10 rounded-xl ${report.bgClass} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={18} className={report.iconClass} />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{report.title}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">{report.description}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03, x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  disabled={loadingId !== null}
                  onClick={() => void handleGenerate(report)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full"
                        />
                        Generating...
                      </motion.div>
                    ) : justGenerated ? (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 size={14} />
                        Downloaded!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Download size={14} />
                        Export as {format.toUpperCase()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
