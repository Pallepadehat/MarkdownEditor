/**
 * Mermaid diagram rendering extension for CodeMirror 6
 *
 * Renders mermaid code blocks as live, resizable diagrams.
 * Features:
 * - Lazy loading of Mermaid library (~2.4MB)
 * - Widget caching to avoid re-rendering unchanged diagrams
 * - Resize support
 */

import { Extension, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { createElement } from "../utils/dom";
import { getCachedWidget } from "./base";

// Lazy-loaded Mermaid instance
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
let mermaidInstance: typeof import("mermaid").default | null = null;
let currentTheme: "light" | "dark" = "light";

/**
 * Lazily loads the Mermaid library.
 */
async function getMermaid() {
  if (mermaidInstance) return mermaidInstance;

  if (!mermaidPromise) {
    mermaidPromise = import("mermaid");
  }

  const module = await mermaidPromise;
  mermaidInstance = module.default;

  mermaidInstance.initialize({
    startOnLoad: false,
    theme: currentTheme === "dark" ? "dark" : "default",
    securityLevel: "strict",
  });

  return mermaidInstance;
}

/**
 * Updates the Mermaid theme.
 */
export function setMermaidTheme(theme: "light" | "dark"): void {
  currentTheme = theme;
  if (mermaidInstance) {
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    });
  }
}

/**
 * Widget that renders a Mermaid diagram.
 */
class MermaidWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }

  eq(other: MermaidWidget) {
    return this.code === other.code;
  }

  toDOM() {
    const container = createElement("div");
    container.className = "cm-mermaid-container cm-widget-container";

    const content = createElement("div");
    content.className = "cm-mermaid-content";
    container.appendChild(content);

    // Resize handle
    const resizeHandle = createElement("div");
    resizeHandle.className = "cm-widget-resize-handle";
    resizeHandle.innerHTML = "⤡";
    container.appendChild(resizeHandle);

    const id = "mermaid-" + Math.random().toString(36).substr(2, 9);

    // Async render
    const render = async () => {
      content.innerHTML = '<div class="cm-mermaid-loading">Rendering...</div>';

      try {
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(id, this.code);
        content.innerHTML = svg;
      } catch (e) {
        console.error("Mermaid render error:", e);
        content.innerHTML = `<div class="cm-mermaid-error">Diagram Error</div>`;
      }
    };

    render();

    // Resize handling
    let startX = 0,
      startY = 0,
      startWidth = 0,
      startHeight = 0;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.style.width = `${Math.max(200, startWidth + dx)}px`;
      container.style.height = `${Math.max(100, startHeight + dy)}px`;

      const svg = content.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "100%";
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";
      container.classList.remove("resizing");
    };

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      const rect = container.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "nwse-resize";
      container.classList.add("resizing");
    });

    (container as any)._cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    return container;
  }

  destroy(dom: HTMLElement) {
    const cleanup = (dom as any)._cleanup;
    if (cleanup) cleanup();
  }

  ignoreEvent(event: Event) {
    return !!(event.target as HTMLElement).closest(".cm-widget-resize-handle");
  }
}

/**
 * Creates a cached MermaidWidget.
 */
function createMermaidWidget(code: string): MermaidWidget {
  const cacheKey = `mermaid:${code}`;
  return getCachedWidget(cacheKey, () => new MermaidWidget(code));
}

const mermaidField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state.doc.toString());
  },
  update(decorations, tr) {
    if (tr.docChanged) {
      return buildDecorations(tr.state.doc.toString());
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

function buildDecorations(text: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text))) {
    const to = match.index + match[0].length;
    const widget = Decoration.widget({
      widget: createMermaidWidget(match[1]),
      block: true,
      side: 1,
    });
    builder.add(to, to, widget);
  }

  return builder.finish();
}

const mermaidStyles = EditorView.baseTheme({
  ".cm-mermaid-container": {
    position: "relative",
    background: "var(--mermaid-bg, rgba(0,0,0,0.05))",
    padding: "1rem",
    borderRadius: "8px",
    margin: "0.5rem 0",
    textAlign: "center",
    minWidth: "200px",
    minHeight: "100px",
    display: "inline-block",
    overflow: "hidden",
    userSelect: "none",
  },
  ".cm-mermaid-content": {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  ".cm-mermaid-loading": {
    color: "var(--mermaid-text, #666)",
    fontStyle: "italic",
  },
  ".cm-mermaid-error": {
    color: "red",
  },
  ".cm-widget-resize-handle": {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    width: "16px",
    height: "16px",
    cursor: "nwse-resize",
    color: "var(--mermaid-handle-color, #888)",
    opacity: "0.5",
    fontSize: "12px",
    lineHeight: "16px",
    textAlign: "center",
    userSelect: "none",
    transition: "opacity 0.2s",
    borderRadius: "4px",
  },
  ".cm-mermaid-container:hover .cm-widget-resize-handle": {
    opacity: "1",
    background: "rgba(0,0,0,0.1)",
  },
});

const themeVarsLight = EditorView.theme(
  {
    "&": {
      "--mermaid-bg": "rgba(0,0,0,0.05)",
      "--mermaid-handle-color": "#888",
      "--mermaid-text": "#666",
    },
  },
  { dark: false }
);

const themeVarsDark = EditorView.theme(
  {
    "&": {
      "--mermaid-bg": "rgba(255,255,255,0.05)",
      "--mermaid-handle-color": "#aaa",
      "--mermaid-text": "#999",
    },
  },
  { dark: true }
);

/**
 * Creates the Mermaid diagram extension.
 */
export function createMermaidExtension(): Extension {
  return [mermaidField, mermaidStyles, themeVarsLight, themeVarsDark];
}
