/**
 * Mermaid diagram rendering extension for CodeMirror 6
 * Renders mermaid code blocks as live diagrams
 */

import { Extension, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import mermaid from "mermaid";

// Track current theme
let currentTheme: "light" | "dark" = "light";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "strict",
});

export function setMermaidTheme(theme: "light" | "dark"): void {
  currentTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "strict",
  });
}

class MermaidWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }

  eq(other: MermaidWidget) {
    return this.code === other.code;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-mermaid-container";

    // Create a wrapper for content to ensure resize handle stays positioned correctly
    const content = document.createElement("div");
    content.className = "cm-mermaid-content";
    container.appendChild(content);

    // Create resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "cm-mermaid-resize-handle";
    resizeHandle.innerHTML = "⤡"; // Unicode resize character
    container.appendChild(resizeHandle);

    // Create a unique ID for this render
    const id = "mermaid-" + Math.random().toString(36).substr(2, 9);

    // Render immediately if possible, or defer
    const render = async () => {
      try {
        content.innerHTML = '<div class="loading">Rendering...</div>';
        const { svg } = await mermaid.render(id, this.code);
        content.innerHTML = svg;
      } catch (e) {
        console.error("Mermaid Render Error", e);
        content.innerHTML = "";
        const errorDiv = document.createElement("div");
        errorDiv.className = "error";
        errorDiv.textContent = `Mermaid Error: ${e}`;
        content.appendChild(errorDiv);
      }
    };

    render();

    // Resize Logic
    let startX: number, startY: number, startWidth: number, startHeight: number;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newWidth = Math.max(200, startWidth + dx);
      const newHeight = Math.max(100, startHeight + dy);

      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;

      // Also ensure content scales appropriately
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
      e.preventDefault(); // Prevent text selection
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

    // Attach cleanup function to the container for destroy() to call
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
    // Allow interactions with the resize handle
    if ((event.target as HTMLElement).closest(".cm-mermaid-resize-handle")) {
      return true;
    }
    return false;
  }
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
      widget: new MermaidWidget(match[1]),
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
    display: "inline-block", // Allows resizing logic to determine width
    overflow: "hidden", // Clip content if resized smaller
    userSelect: "none",
  },
  ".cm-mermaid-content": {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none", // Let clicks pass through, or disable for diagrams
  },
  ".cm-mermaid-resize-handle": {
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
  ".cm-mermaid-container:hover .cm-mermaid-resize-handle": {
    opacity: "1",
    background: "rgba(0,0,0,0.1)",
  },
  ".error": { color: "red" },
});

const themeVars = EditorView.theme(
  {
    "&": {
      "--mermaid-bg": "rgba(0,0,0,0.05)",
      "--mermaid-handle-color": "#888",
    },
  },
  { dark: false }
);

const darkThemeVars = EditorView.theme(
  {
    "&": {
      "--mermaid-bg": "rgba(255,255,255,0.05)",
      "--mermaid-handle-color": "#aaa",
    },
  },
  { dark: true }
);

export function createMermaidExtension(): Extension {
  return [mermaidField, mermaidStyles, themeVars, darkThemeVars];
}
