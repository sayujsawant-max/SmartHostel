import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { showError } from '@/utils/toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

/* ───── types ───── */
type ReportType = 'occupancy' | 'complaints' | 'fee' | 'attendance' | 'mess' | 'leave';
type ChartType = 'bar' | 'line' | 'area' | 'pie';

interface ReportOption {
  id: ReportType;
  icon: string;
  label: string;
  description: string;
  columns: string[];
  filters: { label: string; options: string[] }[];
}

/* ───── constants ───── */
const REPORT_TYPES: ReportOption[] = [
  {
    id: 'occupancy',
    icon: '🏠',
    label: 'Occupancy',
    description: 'Room allocation & vacancy analysis across blocks',
    columns: ['Block', 'Floor', 'Total Rooms', 'Occupied', 'Vacant', 'Occupancy %'],
    filters: [
      { label: 'Block', options: ['All', 'A', 'B', 'C', 'D'] },
      { label: 'Floor', options: ['All', '1', '2', '3', '4'] },
    ],
  },
  {
    id: 'complaints',
    icon: '📋',
    label: 'Complaints',
    description: 'Complaint trends, categories, and resolution rates',
    columns: ['Category', 'Total', 'Resolved', 'Pending', 'Avg Resolution Time', 'Satisfaction'],
    filters: [
      { label: 'Block', options: ['All', 'A', 'B', 'C', 'D'] },
      { label: 'Status', options: ['All', 'Resolved', 'Pending', 'Escalated'] },
    ],
  },
  {
    id: 'fee',
    icon: '💰',
    label: 'Fee Collection',
    description: 'Payment status, dues, and collection efficiency',
    columns: ['Block', 'Total Students', 'Paid', 'Pending', 'Overdue', 'Collection %'],
    filters: [
      { label: 'Block', options: ['All', 'A', 'B', 'C', 'D'] },
      { label: 'Status', options: ['All', 'Paid', 'Pending', 'Overdue'] },
    ],
  },
  {
    id: 'attendance',
    icon: '✅',
    label: 'Attendance',
    description: 'Student attendance records and patterns',
    columns: ['Student', 'Block', 'Present Days', 'Absent Days', 'Attendance %', 'Streak'],
    filters: [
      { label: 'Block', options: ['All', 'A', 'B', 'C', 'D'] },
      { label: 'Floor', options: ['All', '1', '2', '3', '4'] },
    ],
  },
  {
    id: 'mess',
    icon: '🍽',
    label: 'Mess Usage',
    description: 'Meal consumption, wastage, and preference data',
    columns: ['Meal', 'Avg Diners', 'Peak Day', 'Wastage %', 'Rating', 'Cost/Meal'],
    filters: [
      { label: 'Block', options: ['All', 'A', 'B', 'C', 'D'] },
      { label: 'Status', options: ['All', 'Breakfast', 'Lunch', 'Dinner'] },
    ],
  },
  {
    id: 'leave',
    icon: '🚪',
    label: 'Leave',
    description: 'Leave applications, approvals, and absence patterns',
    columns: ['Type', 'Applied', 'Approved', 'Rejected', 'Pending', 'Avg Duration'],
    filters: [
      { label: 'Block', options: ['All', 'A', 'B', 'C', 'D'] },
      { label: 'Status', options: ['All', 'Approved', 'Rejected', 'Pending'] },
    ],
  },
];

const CHART_TYPES: { id: ChartType; icon: string; label: string }[] = [
  { id: 'bar', icon: '📊', label: 'Bar' },
  { id: 'line', icon: '📈', label: 'Line' },
  { id: 'area', icon: '🏔', label: 'Area' },
  { id: 'pie', icon: '🥧', label: 'Pie' },
];

const SAMPLE_DATA = [
  { name: 'Block A', value: 87, secondary: 72 },
  { name: 'Block B', value: 65, secondary: 58 },
  { name: 'Block C', value: 92, secondary: 81 },
  { name: 'Block D', value: 73, secondary: 69 },
  { name: 'Block E', value: 56, secondary: 48 },
  { name: 'Block F', value: 81, secondary: 76 },
];

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

/* ───── chart preview component ───── */
function ChartPreview({ chartType, reportType }: { chartType: ChartType; reportType: ReportType }) {
  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    color: 'hsl(var(--foreground))',
  };

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={SAMPLE_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="value" name={reportType} fill="#6366f1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="secondary" name="Previous" fill="#6366f1" fillOpacity={0.3} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={SAMPLE_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="value" name={reportType} stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="secondary" name="Previous" stroke="#6366f1" strokeOpacity={0.4} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={SAMPLE_DATA}>
          <defs>
            <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Area type="monotone" dataKey="value" name={reportType} stroke="#6366f1" strokeWidth={2} fill="url(#reportGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // pie
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={SAMPLE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" stroke="none">
          {SAMPLE_DATA.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ───── main component ───── */
export default function ReportBuilderPage() {
  const [ready, setReady] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>('occupancy');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dateFrom, setDateFrom] = useState('2026-02-01');
  const [dateTo, setDateTo] = useState('2026-03-24');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvDone, setCsvDone] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);

  const currentReport = useMemo(
    () => REPORT_TYPES.find((r) => r.id === selectedType)!,
    [selectedType]
  );

  // initialise columns and filters when report type changes
  const handleSelectType = (id: ReportType) => {
    setSelectedType(id);
    const report = REPORT_TYPES.find((r) => r.id === id)!;
    setSelectedColumns(new Set(report.columns));
    setFilterValues({});
    setCsvDone(false);
    setPdfDone(false);
  };

  // initialise on first render
  useState(() => {
    setSelectedColumns(new Set(REPORT_TYPES[0].columns));
    setTimeout(() => setReady(true), 400);
  });

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const handleExportCsv = async () => {
    setCsvLoading(true);
    setCsvDone(false);
    await new Promise((r) => setTimeout(r, 1500));
    setCsvLoading(false);
    setCsvDone(true);
    setTimeout(() => setCsvDone(false), 3000);
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    setPdfDone(false);
    await new Promise((r) => setTimeout(r, 2000));
    setPdfLoading(false);
    setPdfDone(true);
    setTimeout(() => setPdfDone(false), 3000);
  };

  if (!ready) return <PageSkeleton />;

  return (
    <div className="min-h-screen space-y-8 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Report Builder"
        subtitle="Build, preview, and export custom hostel reports"
      />

      {/* ── report type selector ── */}
      <Reveal>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Report Type
          </h3>
          <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_TYPES.map((r) => (
              <StaggerItem key={r.id}>
                <motion.button
                  layout
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={() => handleSelectType(r.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedType === r.id
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 shadow-md'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))]/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">{r.label}</p>
                      <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">{r.description}</p>
                    </div>
                  </div>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Reveal>

      {/* ── date range & filters ── */}
      <Reveal>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* date range */}
          <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Date Range
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                />
              </div>
            </div>
          </div>

          {/* filters */}
          <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Filters
            </h3>
            <div className="flex flex-wrap gap-4">
              {currentReport.filters.map((f) => (
                <div key={f.label} className="flex-1 min-w-[140px]">
                  <label className="mb-1 block text-xs text-[hsl(var(--muted-foreground))]">{f.label}</label>
                  <select
                    value={filterValues[f.label] ?? 'All'}
                    onChange={(e) => setFilterValues((p) => ({ ...p, [f.label]: e.target.value }))}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── chart type selector ── */}
      <Reveal>
        <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Chart Type
          </h3>
          <div className="flex flex-wrap gap-3">
            {CHART_TYPES.map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                transition={spring}
                onClick={() => setChartType(c.id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors ${
                  chartType === c.id
                    ? 'border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                    : 'border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                }`}
              >
                <span className="text-lg">{c.icon}</span>
                {c.label}
              </motion.button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── chart preview ── */}
      <Reveal>
        <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Preview &mdash; {currentReport.label} ({CHART_TYPES.find((c) => c.id === chartType)?.label} Chart)
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${chartType}-${selectedType}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
            >
              <ChartPreview chartType={chartType} reportType={selectedType} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>

      {/* ── column selector ── */}
      <Reveal>
        <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Columns to Include
          </h3>
          <div className="flex flex-wrap gap-3">
            {currentReport.columns.map((col) => (
              <motion.label
                key={col}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  selectedColumns.has(col)
                    ? 'border border-[hsl(var(--primary))]/50 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                    : 'border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.has(col)}
                  onChange={() => toggleColumn(col)}
                  className="sr-only"
                />
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selectedColumns.has(col)
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
                      : 'border-[hsl(var(--border))]'
                  }`}
                >
                  {selectedColumns.has(col) && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {col}
              </motion.label>
            ))}
          </div>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <AnimatedCounter value={selectedColumns.size} /> of {currentReport.columns.length} columns selected
          </p>
        </div>
      </Reveal>

      {/* ── export buttons ── */}
      <Reveal>
        <div className="flex flex-wrap gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            disabled={csvLoading}
            onClick={handleExportCsv}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:bg-emerald-600 disabled:opacity-60"
          >
            {csvLoading ? 'Generating...' : csvDone ? 'Downloaded!' : 'Export CSV'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            disabled={pdfLoading}
            onClick={handleExportPdf}
            className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:bg-indigo-600 disabled:opacity-60"
          >
            {pdfLoading ? 'Generating...' : pdfDone ? 'Downloaded!' : 'Export PDF'}
          </motion.button>
        </div>
      </Reveal>
    </div>
  );
}
