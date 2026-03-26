import type { Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`);
  }

  // In production, send to your analytics endpoint
  if (import.meta.env.PROD && navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/vitals',
      JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      }),
    );
  }
}

export async function reportWebVitals() {
  const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
