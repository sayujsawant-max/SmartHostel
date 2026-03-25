import type { Request, Response } from 'express';
import { z } from 'zod';
import * as reportBuilderService from '@services/report-builder.service.js';
import { AppError } from '@utils/app-error.js';

const generateReportSchema = z.object({
  type: z.string().min(1),
  dateRange: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
  format: z.enum(['json', 'csv']).default('json'),
});

export async function generateReport(req: Request, res: Response) {
  const parsed = generateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid report input', 400, {
      field: parsed.error.issues[0]?.path[0]?.toString(),
    });
  }

  const dateRange = {
    start: new Date(parsed.data.dateRange.start),
    end: new Date(parsed.data.dateRange.end),
  };

  const report = await reportBuilderService.generateReport(
    parsed.data.type as Parameters<typeof reportBuilderService.generateReport>[0],
    dateRange,
    parsed.data.format,
  );

  if (parsed.data.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${parsed.data.type}.csv`);
    res.send(report.content);
    return;
  }

  res.json({
    success: true,
    data: { report },
    correlationId: req.correlationId,
  });
}
