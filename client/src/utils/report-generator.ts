import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 6;

  if (subtitle) {
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }

  // Divider line
  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  return y;
}

function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
    doc.text('SmartHostel', 14, pageHeight - 10);
  }
}

// ---------------------------------------------------------------------------
// Occupancy Report
// ---------------------------------------------------------------------------

export interface OccupancyRoom {
  block: string;
  roomNumber: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
}

export function generateOccupancyReport(rooms: OccupancyRoom[]): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const startY = addHeader(doc, 'SmartHostel \u2014 Occupancy Report');

  const body = rooms.map((r) => {
    const available = r.totalBeds - r.occupiedBeds;
    const pct = r.totalBeds > 0 ? ((r.occupiedBeds / r.totalBeds) * 100).toFixed(1) : '0.0';
    return [r.block, r.roomNumber, r.roomType, r.acType, r.totalBeds, r.occupiedBeds, available, `${pct}%`];
  });

  // Summary row
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupiedBeds, 0);
  const totalAvailable = totalBeds - totalOccupied;
  const totalPct = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : '0.0';
  body.push(['TOTAL', '', '', '', totalBeds, totalOccupied, totalAvailable, `${totalPct}%`]);

  autoTable(doc, {
    startY,
    head: [['Block', 'Room', 'Type', 'AC', 'Total Beds', 'Occupied', 'Available', 'Occupancy %']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    didParseCell(data) {
      // Bold the summary row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [235, 245, 251];
      }
    },
  });

  addFooter(doc);
  doc.save('occupancy-report.pdf');
}

// ---------------------------------------------------------------------------
// Complaints Report
// ---------------------------------------------------------------------------

export interface ComplaintRow {
  _id: string;
  category: string;
  status: string;
  priority: string;
  studentId?: { name: string } | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export function generateComplaintsReport(complaints: ComplaintRow[]): void {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Date range from data
  const dates = complaints.map((c) => new Date(c.createdAt).getTime());
  const minDate = dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : 'N/A';
  const maxDate = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : 'N/A';

  const startY = addHeader(doc, 'SmartHostel \u2014 Complaints Report', `Date range: ${minDate} \u2013 ${maxDate}`);

  const body = complaints.map((c) => [
    c._id.slice(-6).toUpperCase(),
    c.category,
    c.status,
    c.priority,
    c.studentId?.name ?? 'N/A',
    new Date(c.createdAt).toLocaleDateString(),
    c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '\u2014',
  ]);

  autoTable(doc, {
    startY,
    head: [['ID', 'Category', 'Status', 'Priority', 'Student', 'Created', 'Resolved']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Summary section
  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 200;
  let summaryY = finalY + 10;

  // Totals by status
  const byStatus: Record<string, number> = {};
  for (const c of complaints) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, summaryY);
  summaryY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  for (const [status, count] of Object.entries(byStatus)) {
    doc.text(`${status}: ${count}`, 14, summaryY);
    summaryY += 5;
  }

  // Average resolution time
  const resolved = complaints.filter((c) => c.resolvedAt);
  let avgHours = 0;
  if (resolved.length > 0) {
    const totalMs = resolved.reduce(
      (sum, c) => sum + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()),
      0,
    );
    avgHours = totalMs / resolved.length / (1000 * 60 * 60);
  }
  summaryY += 3;
  doc.text(`Average resolution time: ${avgHours.toFixed(1)} hours`, 14, summaryY);

  addFooter(doc);
  doc.save('complaints-report.pdf');
}

// ---------------------------------------------------------------------------
// Fee Collection Report
// ---------------------------------------------------------------------------

export interface FeeCollectionData {
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    byBlock: { block: string; total: number; occupied: number }[];
  };
  fees: {
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
}

export function generateFeeCollectionReport(analytics: FeeCollectionData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const startY = addHeader(doc, 'SmartHostel \u2014 Fee Collection Report');

  const body = analytics.occupancy.byBlock.map((b) => {
    const occupiedRatio = b.total > 0 ? b.occupied / b.total : 0;
    const blockCollected = analytics.fees.totalCollected * (b.total > 0 ? b.occupied / analytics.occupancy.occupiedBeds : 0);
    const blockPending = analytics.fees.totalPending * (b.total > 0 ? b.occupied / analytics.occupancy.occupiedBeds : 0);
    return [
      b.block,
      'Hostel Fee',
      `\u20B9${blockCollected.toFixed(0)}`,
      '\u2014',
      occupiedRatio >= 0.5 ? 'Partially Collected' : 'Pending',
      'Current',
    ];
  });

  autoTable(doc, {
    startY,
    head: [['Block', 'Fee Type', 'Amount', 'Due Date', 'Status', 'Semester']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Summary
  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 200;
  let summaryY = finalY + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, summaryY);
  summaryY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Collected: \u20B9${analytics.fees.totalCollected.toLocaleString()}`, 14, summaryY);
  summaryY += 5;
  doc.text(`Total Pending: \u20B9${analytics.fees.totalPending.toLocaleString()}`, 14, summaryY);
  summaryY += 5;
  doc.text(`Collection Rate: ${analytics.fees.collectionRate.toFixed(1)}%`, 14, summaryY);

  addFooter(doc);
  doc.save('fee-collection-report.pdf');
}

// ---------------------------------------------------------------------------
// Leave Report
// ---------------------------------------------------------------------------

export interface LeaveRow {
  _id: string;
  studentId?: { name: string } | null;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  approvedBy?: { name: string } | null;
}

export function generateLeaveReport(leaves: LeaveRow[]): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const startY = addHeader(doc, 'SmartHostel \u2014 Leave Summary Report');

  const body = leaves.map((l) => [
    (l.studentId?.name) ?? 'N/A',
    l.type,
    new Date(l.startDate).toLocaleDateString(),
    new Date(l.endDate).toLocaleDateString(),
    l.status,
    l.approvedBy?.name ?? '\u2014',
  ]);

  autoTable(doc, {
    startY,
    head: [['Student', 'Type', 'Start', 'End', 'Status', 'Approved By']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Summary by status
  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 200;
  let summaryY = finalY + 10;

  const byStatus: Record<string, number> = {};
  for (const l of leaves) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, summaryY);
  summaryY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  for (const [status, count] of Object.entries(byStatus)) {
    doc.text(`${status}: ${count}`, 14, summaryY);
    summaryY += 5;
  }

  addFooter(doc);
  doc.save('leave-summary-report.pdf');
}
