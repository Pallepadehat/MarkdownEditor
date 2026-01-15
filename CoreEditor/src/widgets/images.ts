/**
 * Inline image rendering extension for CodeMirror 6
 *
 * Renders Markdown images (![alt](url)) as resizable previews.
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

/**
 * Widget that renders an image preview.
 */
class ImageWidget extends WidgetType {
  constructor(readonly url: string, readonly alt: string) {
    super();
  }

  eq(other: ImageWidget) {
    return this.url === other.url && this.alt === other.alt;
  }

  toDOM() {
    const container = createElement("div");
    container.className = "cm-image-container cm-widget-container";

    const img = createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.className = "cm-image-content";
    container.appendChild(img);

    const resizeHandle = createElement("div");
    resizeHandle.className = "cm-image-resize-handle";
    resizeHandle.innerHTML = "⤡";
    container.appendChild(resizeHandle);

    // Width-based resize to preserve aspect ratio
    let startX = 0,
      startWidth = 0;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      container.style.width = `${Math.max(50, startWidth + dx)}px`;
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
      e.preventDefault();
      startX = e.clientX;
      startWidth = container.getBoundingClientRect().width;

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
    return !!(event.target as HTMLElement).closest(".cm-image-resize-handle");
  }
}

/**
 * Creates a cached ImageWidget.
 */
function createImageWidget(url: string, alt: string): ImageWidget {
  const cacheKey = `image:${url}:${alt}`;
  return getCachedWidget(cacheKey, () => new ImageWidget(url, alt));
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
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = regex.exec(text))) {
    const to = match.index + match[0].length;
    const widget = Decoration.widget({
      widget: createImageWidget(match[2], match[1]),
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
    display: "inline-block",
    margin: "0.5rem 0",
    maxWidth: "100%",
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

/**
 * Creates the image rendering extension.
 */
export function createImageExtension(): Extension {
  return [imageField, imageStyles];
}
