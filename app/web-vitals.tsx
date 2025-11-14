'use client';

/**
 * Web Vitals reporting component
 * Tracks Core Web Vitals and reports to analytics
 */

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '@/lib/performance';

export function WebVitals() {
  useReportWebVitals((metric) => {
    reportWebVitals(metric);
  });

  useEffect(() => {
    // Monitor long tasks in development
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/performance').then(({ monitorLongTasks, monitorCLS }) => {
        monitorLongTasks();
        monitorCLS();
      });
    }
  }, []);

  return null;
}
