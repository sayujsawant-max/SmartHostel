import { test, expect } from '@playwright/test';
import {
  login,
  loginViaApi,
  TEST_WARDEN_EMAIL,
  TEST_WARDEN_PASSWORD,
} from './helpers';

const API_BASE = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

test.describe.serial('Occupancy forecast', () => {
  test('timeline endpoint returns matching past+future series and a usable summary', async ({
    request,
  }) => {
    const cookies = await loginViaApi(request, TEST_WARDEN_EMAIL, TEST_WARDEN_PASSWORD);
    const res = await request.get(
      `${API_BASE}/admin/occupancy/timeline?lookbackDays=30&forecastDays=14`,
      { headers: { cookie: cookies, Origin: ORIGIN } },
    );
    expect(res.ok(), `timeline request: ${await res.text()}`).toBeTruthy();

    const body = (await res.json()) as {
      data: {
        series: Array<{
          date: string;
          present?: number;
          forecast?: number;
          approvedAbsent: number;
        }>;
        summary: {
          totalStudents: number;
          todayPresent: number;
          nextWeekAvgForecast: number;
          nextMonthLow: { date: string; forecast: number } | null;
          nextMonthHigh: { date: string; forecast: number } | null;
          approvedFutureLeaves: number;
        };
        meta: { lookbackDays: number; forecastDays: number; today: string };
      };
    };

    const { series, summary, meta } = body.data;

    // 30 days history + 14 forecast + today = 45 points.
    expect(series.length).toBe(meta.lookbackDays + meta.forecastDays + 1);

    // Rows split cleanly: every row has exactly one of present|forecast filled.
    for (const p of series) {
      const hasPresent = typeof p.present === 'number';
      const hasForecast = typeof p.forecast === 'number';
      expect(hasPresent !== hasForecast).toBe(true);
    }

    // Summary numbers are sane against totalStudents.
    expect(summary.totalStudents).toBeGreaterThan(0);
    expect(summary.todayPresent).toBeLessThanOrEqual(summary.totalStudents);
    expect(summary.nextWeekAvgForecast).toBeLessThanOrEqual(summary.totalStudents);
    if (summary.nextMonthLow && summary.nextMonthHigh) {
      expect(summary.nextMonthLow.forecast).toBeLessThanOrEqual(summary.nextMonthHigh.forecast);
    }
  });

  test('warden /forecast page renders chart + summary cards', async ({ page }) => {
    await login(page, 'warden');
    await page.goto('/warden/forecast');

    await expect(page.getByRole('heading', { name: 'Occupancy Forecast' })).toBeVisible();
    await expect(page.getByText(/Today present/)).toBeVisible();
    await expect(page.getByText(/Next-week average/)).toBeVisible();
    await expect(page.getByText(/Forecast low/)).toBeVisible();
    await expect(page.getByText(/Forecast high/)).toBeVisible();

    // Chart container renders. recharts wraps the SVG inside a sized div.
    const chart = page.getByTestId('forecast-chart');
    await expect(chart).toBeVisible();
    await expect(chart.locator('svg').first()).toBeVisible({ timeout: 10_000 });

    // ReferenceLine for "today" label is part of the rendered chart.
    await expect(chart.getByText('today')).toBeVisible();

    // Wait for the AnimatedCounter on the summary cards to settle (rough — the
    // counter animates ~1s) so the screenshot captures final values.
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/occupancy-forecast.png', fullPage: true });

    // Switching range refetches and re-renders the chart.
    await page.getByRole('button', { name: '8w forecast' }).click();
    await expect(chart.locator('svg').first()).toBeVisible({ timeout: 10_000 });
  });
});
