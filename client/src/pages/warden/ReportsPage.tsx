import { useState } from 'react';
import { apiFetch } from '@services/api';
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

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  generate: () => Promise<void>;
}

export default function ReportsPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (id: string, generate: () => Promise<void>) => {
    setLoadingId(id);
    setError(null);
    try {
      await generate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoadingId(null);
    }
  };

  const reports: ReportCard[] = [
    {
      id: 'occupancy',
      title: 'Occupancy Report',
      description: 'Room-wise occupancy breakdown with block totals, bed counts, and occupancy percentages.',
      icon: '\uD83C\uDFE0',
      generate: async () => {
        const res = await apiFetch<{ rooms: OccupancyRoom[] }>('/rooms');
        generateOccupancyReport(res.data.rooms);
      },
    },
    {
      id: 'complaints',
      title: 'Complaints Report',
      description: 'All complaints with category, priority, status, and average resolution time.',
      icon: '\uD83D\uDCCB',
      generate: async () => {
        const res = await apiFetch<{ complaints: ComplaintRow[] }>('/complaints');
        generateComplaintsReport(res.data.complaints);
      },
    },
    {
      id: 'fees',
      title: 'Fee Collection Report',
      description: 'Fee collection summary with total collected, pending amounts, and collection rate.',
      icon: '\uD83D\uDCB0',
      generate: async () => {
        const res = await apiFetch<FeeCollectionData>('/admin/analytics');
        generateFeeCollectionReport(res.data);
      },
    },
    {
      id: 'leaves',
      title: 'Leave Summary Report',
      description: 'Student leave records with type, dates, approval status, and summary by status.',
      icon: '\uD83D\uDCC5',
      generate: async () => {
        const res = await apiFetch<{ leaves: LeaveRow[] }>('/leaves');
        generateLeaveReport(res.data.leaves);
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Reports</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Generate and download PDF reports for hostel management.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <div className="mb-4 text-3xl">{report.icon}</div>
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {report.title}
            </h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {report.description}
            </p>
            <button
              type="button"
              disabled={loadingId !== null}
              onClick={() => handleGenerate(report.id, report.generate)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--accent))] px-4 py-2 text-sm font-medium text-[hsl(var(--accent-foreground))] transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingId === report.id ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate PDF'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
