/**
 * Debounce and throttle utilities with performance optimizations.
 */

type AnyFunction = (...args: any[]) => any;

/**
 * Creates a debounced function that delays invoking the callback.
 * Uses requestIdleCallback when available for non-critical updates.
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  delay: number,
  options: { useIdleCallback?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleCallbackId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    if (idleCallbackId && "cancelIdleCallback" in window) {
      (window as any).cancelIdleCallback(idleCallbackId);
    }

    timeoutId = setTimeout(() => {
      if (options.useIdleCallback && "requestIdleCallback" in window) {
        idleCallbackId = (window as any).requestIdleCallback(
          () => fn(...args),
          { timeout: delay * 2 }
        );
      } else {
        fn(...args);
      }
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a throttled function that only invokes at most once per interval.
 */
export function throttle<T extends AnyFunction>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Schedules a callback to run during browser idle time.
 * Falls back to setTimeout if requestIdleCallback is unavailable.
 */
export function runWhenIdle(
  callback: () => void,
  options: { timeout?: number } = {}
): void {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, options.timeout ?? 1);
  }
}
