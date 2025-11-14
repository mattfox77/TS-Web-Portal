/**
 * Performance optimization utilities
 * Helps achieve Lighthouse score of 90+
 */

/**
 * Lazy load images with Intersection Observer
 * @param imageElement - Image element to lazy load
 */
export function lazyLoadImage(imageElement: HTMLImageElement): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    observer.observe(imageElement);
  } else {
    // Fallback for browsers without Intersection Observer
    const src = imageElement.dataset.src;
    if (src) {
      imageElement.src = src;
    }
  }
}

/**
 * Preload critical resources
 * @param href - Resource URL
 * @param as - Resource type
 */
export function preloadResource(href: string, as: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch next page for faster navigation
 * @param href - Page URL to prefetch
 */
export function prefetchPage(href: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Debounce function to limit execution rate
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure performance of a function
 * @param name - Performance mark name
 * @param func - Function to measure
 * @returns Function result
 */
export async function measurePerformance<T>(
  name: string,
  func: () => Promise<T>
): Promise<T> {
  if (typeof performance === 'undefined') {
    return func();
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performance.mark(startMark);
  const result = await func();
  performance.mark(endMark);

  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
  } catch (error) {
    console.error('Performance measurement failed:', error);
  }

  // Cleanup
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(name);

  return result;
}

/**
 * Report Web Vitals to analytics
 * @param metric - Web Vitals metric
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
}): void {
  // Log to console in development
  if (typeof window !== 'undefined') {
    console.log('Web Vital:', metric);
  }

  // Send to analytics in production
  // Example: Send to Google Analytics
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', metric.name, {
  //     value: Math.round(metric.value),
  //     event_label: metric.id,
  //     non_interaction: true,
  //   });
  // }

  // Or send to custom analytics endpoint
  // fetch('/api/analytics/web-vitals', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  //   headers: { 'Content-Type': 'application/json' },
  // });
}

/**
 * Optimize images by converting to WebP format
 * Note: This is a placeholder - actual conversion should happen at build time
 * @param src - Original image source
 * @returns Optimized image source
 */
export function getOptimizedImageSrc(src: string): string {
  // In production, use a CDN or image optimization service
  // For Cloudflare, images are automatically optimized
  return src;
}

/**
 * Check if user prefers reduced motion
 * @returns True if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get connection speed information
 * @returns Connection effective type
 */
export function getConnectionSpeed(): string {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  return connection?.effectiveType || 'unknown';
}

/**
 * Check if device is low-end
 * @returns True if device is low-end
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return true;
  }

  // Check for hardware concurrency
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency && hardwareConcurrency < 4) {
    return true;
  }

  return false;
}

/**
 * Adaptive loading: Load different resources based on device capabilities
 * @param highQuality - High quality resource
 * @param lowQuality - Low quality resource
 * @returns Appropriate resource based on device
 */
export function adaptiveLoad(highQuality: string, lowQuality: string): string {
  const isLowEnd = isLowEndDevice();
  const connectionSpeed = getConnectionSpeed();
  const isSlow = connectionSpeed === 'slow-2g' || connectionSpeed === '2g';

  return isLowEnd || isSlow ? lowQuality : highQuality;
}

/**
 * Request idle callback wrapper with fallback
 * @param callback - Function to execute when idle
 * @param options - Idle callback options
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * Batch DOM updates to minimize reflows
 * @param updates - Array of update functions
 */
export function batchDOMUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Monitor long tasks that block the main thread
 */
export function monitorLongTasks(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // Long task API not supported
  }
}

/**
 * Calculate Cumulative Layout Shift (CLS)
 */
export function monitorCLS(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  let clsValue = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Report CLS on page unload
    window.addEventListener('beforeunload', () => {
      console.log('Cumulative Layout Shift:', clsValue);
    });
  } catch (error) {
    // Layout shift API not supported
  }
}
