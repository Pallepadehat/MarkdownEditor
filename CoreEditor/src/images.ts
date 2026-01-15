/**
 * Inline Image rendering extension for CodeMirror 6
 * Renders markdown images as live resizeable widgets
 */

import { Extension, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";

class ImageWidget extends WidgetType {
  constructor(readonly url: string, readonly alt: string) {
    super();
  }

  eq(other: ImageWidget) {
    return this.url === other.url && this.alt === other.alt;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-image-container";

    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.className = "cm-image-content";
    container.appendChild(img);

    // Create resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "cm-image-resize-handle";
    resizeHandle.innerHTML = "⤡"; // Unicode resize character
    container.appendChild(resizeHandle);

    // Resize Logic
    let startX: number, startY: number, startWidth: number, startHeight: number;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      // We mainly care about width for images, maintaining aspect ratio usually handled by auto height
      // But if we want free resize, we can do both.
      // Let's stick to width-based resizing for now to preserve aspect ratio naturally,
      // or allow both if user wants to stretch.
      // Mermaid implementation was box-based. Images are often width-constrained.
      // Let's modify width and let height be auto for now?
      // Actually standard specific resize usually implies both or width.
      // Let's try width resizing and max-width style.

      const newWidth = Math.max(50, startWidth + dx);
      // const newHeight = Math.max(50, startHeight + dy);

      container.style.width = `${newWidth}px`;
      // container.style.height = `${newHeight}px`; // Auto height
      img.style.width = "100%";
      img.style.height = "auto";
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

    // Attach cleanup function
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
    if ((event.target as HTMLElement).closest(".cm-image-resize-handle")) {
      return true;
    }
    return false;
  }
}

const imageField = StateField.define<DecorationSet>({
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
  // Match ![alt](url)
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = regex.exec(text))) {
    const from = match.index;
    const to = from + match[0].length;

    // We render the widget AFTER the match (block widget below)
    const widget = Decoration.widget({
      widget: new ImageWidget(match[2], match[1]),
      block: true,
      side: 1,
    });
    builder.add(to, to, widget);
  }

  return builder.finish();
}

const imageStyles = EditorView.baseTheme({
  ".cm-image-container": {
    position: "relative",
    display: "inline-block", // Or block
    margin: "0.5rem 0",
    maxWidth: "100%",
    // Default size?
    width: "auto",
    border: "1px solid transparent",
    transition: "border-color 0.2s",
  },
  ".cm-image-container:hover": {
    border: "1px dashed rgba(128,128,128,0.3)",
    borderRadius: "4px",
  },
  ".cm-image-content": {
    display: "block",
    maxWidth: "100%",
    height: "auto",
    borderRadius: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  ".cm-image-resize-handle": {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    width: "16px",
    height: "16px",
    cursor: "nwse-resize",
    color: "white",
    background: "rgba(0,0,0,0.5)",
    borderRadius: "4px",
    fontSize: "12px",
    lineHeight: "16px",
    textAlign: "center",
    opacity: "0",
    transition: "opacity 0.2s",
    userSelect: "none",
  },
  ".cm-image-container:hover .cm-image-resize-handle": {
    opacity: "1",
  },
});

export function createImageExtension(): Extension {
  return [imageField, imageStyles];
}
