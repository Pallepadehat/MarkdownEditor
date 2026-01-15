/**
 * Shared widget utilities for CodeMirror 6 widgets.
 *
 * Provides:
 * - LRU widget caching to avoid recreating identical widgets
 * - Shared resize handling logic
 * - Theme variable definitions
 */

import { WidgetType } from "@codemirror/view";
import { createElement } from "../utils/dom";

// LRU cache for widgets
const CACHE_MAX_SIZE = 100;
const widgetCache = new Map<string, { widget: WidgetType; lastUsed: number }>();

/**
 * Gets a cached widget or creates a new one.
 * Uses LRU eviction when cache is full.
 */
export function getCachedWidget<T extends WidgetType>(
  key: string,
  create: () => T
): T {
  const cached = widgetCache.get(key);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.widget as T;
  }

  // Evict oldest entries if cache is full
  if (widgetCache.size >= CACHE_MAX_SIZE) {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of widgetCache) {
      if (v.lastUsed < oldestTime) {
        oldestTime = v.lastUsed;
        oldest = k;
      }
    }

    if (oldest) widgetCache.delete(oldest);
  }

  const widget = create();
  widgetCache.set(key, { widget, lastUsed: Date.now() });
  return widget;
}

/**
 * Clears the widget cache.
 */
export function clearWidgetCache(): void {
  widgetCache.clear();
}

/**
 * Creates a resize handle element with event handlers.
 */
export function createResizeHandle(
  container: HTMLElement,
  options: {
    onResize: (dx: number, dy: number) => void;
    cursor?: string;
  }
): HTMLElement {
  const handle = createElement("div");
  handle.className = "cm-widget-resize-handle";
  handle.innerHTML = "⤡";

  let startX = 0;
  let startY = 0;

  const onMouseMove = (e: MouseEvent) => {
    options.onResize(e.clientX - startX, e.clientY - startY);
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "default";
    container.classList.remove("resizing");
  };

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;
    startY = e.clientY;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = options.cursor ?? "nwse-resize";
    container.classList.add("resizing");
  });

  // Store cleanup function
  (container as any)._resizeCleanup = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  return handle;
}

/**
 * Cleans up resize handlers attached to a container.
 */
export function cleanupResizeHandle(container: HTMLElement): void {
  const cleanup = (container as any)._resizeCleanup;
  if (cleanup) cleanup();
}

/**
 * Base CSS for all widget resize handles.
 */
export const widgetResizeHandleStyles = `
  .cm-widget-resize-handle {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    color: var(--widget-handle-color, #888);
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 4px;
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    user-select: none;
    background: rgba(0, 0, 0, 0.05);
  }
  
  .cm-widget-container:hover .cm-widget-resize-handle {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }
`;
