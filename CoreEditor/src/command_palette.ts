/**
 * Custom Command Palette Implementation
 *
 * Replaces the default CodeMirror autocomplete to provide a premium, macOS-native feel.
 * It renders a custom absolute overlay that is positioned near the cursor.
 *
 * Key Features:
 * - Capture Phase Event Handling: Intercepts Arrow/Enter/Esc keys before CodeMirror does.
 * - Dynamic Theme Support: Syncs with editor's light/dark mode.
 * - Auto-Dismiss: Closes if the trigger character '/' is deleted.
 */

import { EditorView } from "@codemirror/view";

export interface CommandItem {
  label: string;
  detail: string;
  shortcut?: string;
  section: string;
  apply: (view: EditorView) => void;
}

// Reuse the commands from commands.ts but adapted for our custom palette
export const commands: CommandItem[] = [
  // Formatting
  {
    label: "Bold",
    detail: "Make text bold",
    shortcut: "⌘B",
    section: "Formatting",
    apply: () => window.editorAPI?.toggleBold(),
  },
  {
    label: "Italic",
    detail: "Make text italic",
    shortcut: "⌘I",
    section: "Formatting",
    apply: () => window.editorAPI?.toggleItalic(),
  },
  {
    label: "Strikethrough",
    detail: "Strikethrough text",
    section: "Formatting",
    apply: () => window.editorAPI?.toggleStrikethrough(),
  },
  {
    label: "Code",
    detail: "Inline code",
    section: "Formatting",
    apply: () => window.editorAPI?.toggleCode(),
  },

  // Headings
  {
    label: "Heading 1",
    detail: "Large heading",
    section: "Headings",
    apply: () => window.editorAPI?.insertHeading(1),
  },
  {
    label: "Heading 2",
    detail: "Medium heading",
    section: "Headings",
    apply: () => window.editorAPI?.insertHeading(2),
  },
  {
    label: "Heading 3",
    detail: "Small heading",
    section: "Headings",
    apply: () => window.editorAPI?.insertHeading(3),
  },

  // Lists
  {
    label: "Bullet List",
    detail: "Unordered list",
    section: "Lists",
    apply: () => window.editorAPI?.insertList(false),
  },
  {
    label: "Numbered List",
    detail: "Ordered list",
    section: "Lists",
    apply: () => window.editorAPI?.insertList(true),
  },
  {
    label: "Task List",
    detail: "Todo list",
    section: "Lists",
    apply: (view) => {
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      const prefix = "- [ ] ";
      view.dispatch({
        changes: { from: line.from, to: line.from, insert: prefix },
        selection: { anchor: from + prefix.length },
      });
    },
  },

  // Blocks
  {
    label: "Quote",
    detail: "Blockquote",
    section: "Blocks",
    apply: () => window.editorAPI?.insertBlockquote(),
  },
  {
    label: "Code Block",
    detail: "Fenced code block",
    section: "Blocks",
    apply: () => window.editorAPI?.insertCodeBlock(),
  },
  {
    label: "Divider",
    detail: "Horizontal rule",
    section: "Blocks",
    apply: () => window.editorAPI?.insertHorizontalRule(),
  },

  // Media
  {
    label: "Link",
    detail: "Insert link",
    shortcut: "⌘K",
    section: "Media",
    apply: () => window.editorAPI?.insertLink(""),
  },
  {
    label: "Image",
    detail: "Insert image",
    shortcut: "⌘⇧K",
    section: "Media",
    apply: () => window.editorAPI?.insertImage(""),
  },

  // Diagrams
  {
    label: "Mermaid Diagram",
    detail: "Basic graph",
    section: "Diagrams",
    apply: () =>
      window.editorAPI?.insertText("```mermaid\ngraph TD\n  A --> B\n```"),
  },
  {
    label: "Flowchart",
    detail: "Flowchart diagram",
    section: "Diagrams",
    apply: () =>
      window.editorAPI?.insertText(
        "```mermaid\ngraph LR\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Cancel]\n```"
      ),
  },
  {
    label: "Sequence Diagram",
    detail: "Sequence diagram",
    section: "Diagrams",
    apply: () =>
      window.editorAPI?.insertText(
        "```mermaid\nsequenceDiagram\n  Alice->>John: Hello John, how are you?\n  John-->>Alice: Great!\n```"
      ),
  },
  {
    label: "Class Diagram",
    detail: "Class diagram",
    section: "Diagrams",
    apply: () =>
      window.editorAPI?.insertText(
        "```mermaid\nclassDiagram\n  Animal <|-- Duck\n  Animal : +int age\n  Animal : +String gender\n  class Duck{\n    +String beakColor\n    +swim()\n    +quack()\n  }\n```"
      ),
  },
  {
    label: "Mindmap",
    detail: "Mindmap diagram",
    section: "Diagrams",
    apply: () =>
      window.editorAPI?.insertText(
        "```mermaid\nmindmap\n  root((mindmap))\n    Origins\n    Research\n    Tools\n```"
      ),
  },
];

export class CommandPalette {
  private element: HTMLElement;
  private view: EditorView;
  private active: boolean = false;
  private selectedIndex: number = 0;
  private renderItems: CommandItem[] = [];
  private triggerPos: number = 0;
  private placement: "top" | "bottom" = "bottom";

  /**
   * @param view - The CodeMirror editor view instance
   */
  constructor(view: EditorView) {
    this.view = view;
    this.element = document.createElement("div");
    this.element.className = "command-palette";
    this.element.style.display = "none";
    document.body.appendChild(this.element);

    // Initial styles
    const style = document.createElement("style");
    style.textContent = `
      .command-palette {
        position: absolute;
        width: 320px;
        max-height: 400px;
        overflow-y: auto;
        background: rgba(35, 35, 40, 0.72); /* Default Dark */
        backdrop-filter: blur(50px) saturate(190%);
        -webkit-backdrop-filter: blur(50px) saturate(190%);
        border: 0.5px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(255,255,255,0.1);
        padding: 6px;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        animation: palette-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: none;
        flex-direction: column;
        gap: 2px;
      }
      
      .command-palette::-webkit-scrollbar {
        display: none;
      }
      .command-palette {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      @keyframes palette-fade {
        from { opacity: 0; transform: translateY(4px) scale(0.98); }
        to { opacity: 1; transform: translateY(6px) scale(1); }
      }

      .palette-section {
        padding: 8px 12px 4px 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: rgba(235, 235, 245, 0.5);
        margin-top: 6px;
        margin-bottom: 2px;
        border-top: 1px solid rgba(84, 84, 88, 0.4);
      }
      
      .palette-section:first-child {
        margin-top: 0;
        border-top: none;
      }

      .palette-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 12px;
        min-height: 36px;
        border-radius: 8px;
        cursor: default;
        transition: background-color 0.1s;
        color: white;
      }

      .palette-item.selected {
        background-color: rgba(255, 255, 255, 0.1); /* Minimalist Neutral */
      }

      .palette-label {
        font-size: 13.5px;
        font-weight: 600; /* Force Semi-Bold for consistent thickness */
        letter-spacing: -0.01em;
      }

      .palette-detail {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.55);
        font-weight: 400;
      }
      
      .palette-no-results {
        padding: 12px;
        text-align: center;
        color: rgba(255, 255, 255, 0.4);
        font-size: 13px;
      }

      /* Light Mode Styles */
      .command-palette.light-theme {
        background: rgba(255, 255, 255, 0.72);
        border-color: rgba(0,0,0,0.08);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0,0,0,0.05);
      }
      
      .command-palette.light-theme .palette-item {
        color: black;
      }
      
      .command-palette.light-theme .palette-item.selected {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .command-palette.light-theme .palette-section {
        color: rgba(60, 60, 67, 0.5);
        border-top-color: rgba(60, 60, 67, 0.1);
      }
      
      .command-palette.light-theme .palette-detail {
        color: rgba(60, 60, 67, 0.55);
      }

      .command-palette.light-theme .palette-no-results {
        color: rgba(60, 60, 67, 0.4);
      }
    `;
    document.head.appendChild(style);

    // Initial render
    this.renderItems = commands;
    this.updateList();

    // Attach capture handler to intercept keys before CodeMirror
    this.view.dom.addEventListener("keydown", this.handleKey.bind(this), {
      capture: true,
    });
  }

  setTheme(theme: "light" | "dark") {
    if (theme === "light") {
      this.element.classList.add("light-theme");
    } else {
      this.element.classList.remove("light-theme");
    }
  }

  show(left: number, top: number, triggerPos: number) {
    // console.log("[CommandPalette] Showing at", left, top);
    this.active = true;
    this.triggerPos = triggerPos;
    this.element.style.display = "flex";

    // Reset selection
    this.selectedIndex = 0;

    // Reset filter
    this.renderItems = commands;
    this.updateList();

    // Determine initial placement preference based on available space
    // We assume max height (approx 400px) to be safe for the "fit" check so we don't flip later
    const viewportHeight = window.innerHeight;
    const maxPossibleHeight = 400;

    // Default to bottom
    this.placement = "bottom";

    // If bottom overflow?
    if (top + 24 + maxPossibleHeight > viewportHeight - 10) {
      // Check top space
      if (top - maxPossibleHeight - 10 > 0) {
        this.placement = "top";
      }
      // If neither fits, keep bottom
    }

    this.updatePosition(left, top);
  }

  updatePosition(left: number, top: number) {
    const paletteWidth = 332;
    const paletteHeight = this.element.offsetHeight; // Use actual rendered height

    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedLeft = left;
    let adjustedTop = 0;

    // Horizontal Fit
    if (adjustedLeft + paletteWidth > viewportWidth - 20) {
      adjustedLeft = viewportWidth - paletteWidth - 20;
    }
    if (adjustedLeft < 20) {
      adjustedLeft = 20;
    }

    // Vertical Fit based on locked placement
    if (this.placement === "top") {
      adjustedTop = top - paletteHeight - 10;
    } else {
      adjustedTop = top + 24;
    }

    // Final safety check
    if (
      adjustedTop + paletteHeight > viewportHeight - 10 &&
      this.placement === "bottom"
    ) {
      adjustedTop = viewportHeight - paletteHeight - 10;
    }
    if (adjustedTop < 10 && this.placement === "top") {
      adjustedTop = 10;
    }

    this.element.style.left = `${adjustedLeft}px`;
    this.element.style.top = `${adjustedTop}px`;
  }

  hide() {
    this.active = false;
    this.element.style.display = "none";
  }

  updateList() {
    this.element.innerHTML = "";

    if (this.renderItems.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "palette-no-results";
      noResults.textContent = "No matching commands";
      this.element.appendChild(noResults);
      return;
    }

    let currentSection = "";

    this.renderItems.forEach((item, index) => {
      if (item.section !== currentSection) {
        currentSection = item.section;
        const section = document.createElement("div");
        section.className = "palette-section";
        section.textContent = currentSection;
        this.element.appendChild(section);
      }

      const el = document.createElement("div");
      el.className = "palette-item";
      if (index === this.selectedIndex) el.classList.add("selected");
      el.innerHTML = `
        <span class="palette-label">${item.label}</span>
        <span class="palette-detail">${item.detail} ${
        item.shortcut ? " " + item.shortcut : ""
      }</span>
      `;
      el.onclick = () => this.selectItem(index);
      this.element.appendChild(el);
    });
  }

  updateSelection() {
    const items = this.element.querySelectorAll(".palette-item");
    items.forEach((el, index) => {
      if (index === this.selectedIndex) {
        el.classList.add("selected");
        el.scrollIntoView({ block: "nearest" });
      } else {
        el.classList.remove("selected");
      }
    });
  }

  selectItem(index: number) {
    const item = this.renderItems[index];
    if (!item) return;

    // Remove the Trigger + Query
    // We need to calculate where we are now
    const { from } = this.view.state.selection.main;
    // this.triggerPos is where '/' is.
    // We replace from triggerPos to current cursor (from)

    // Safety check
    if (this.triggerPos >= 0 && from >= this.triggerPos) {
      this.view.dispatch({
        changes: { from: this.triggerPos, to: from, insert: "" },
      });
    }

    item.apply(this.view);
    this.hide();
  }

  handleUpdate(update: import("@codemirror/view").ViewUpdate) {
    if (!this.active) return;

    if (update.docChanged || update.selectionSet) {
      // Re-evaluate mapping
      const newPos = update.changes.mapPos(this.triggerPos);
      this.triggerPos = newPos;

      const { from } = this.view.state.selection.main;

      // If the cursor moved BEHIND the trigger, close it
      if (from < newPos) {
        this.hide();
        return;
      }

      // Check if trigger slash exists directly before the tracked pos?
      // Actually tracking logic:
      // The slash is at `newPos`. The query is `slice(newPos + 1, from)`.
      // We must check if the character at `newPos` is actually `/`.
      const char = update.state.sliceDoc(newPos, newPos + 1);
      if (char !== "/") {
        this.hide();
        return;
      }

      // Get Query
      const query = update.state.sliceDoc(newPos + 1, from).toLowerCase();

      // Filter items
      if (!query) {
        this.renderItems = commands;
      } else {
        this.renderItems = commands.filter(
          (c) =>
            c.label.toLowerCase().includes(query) ||
            c.section.toLowerCase().includes(query) ||
            (c.shortcut && c.shortcut.toLowerCase().includes(query))
        );
      }

      this.selectedIndex = 0;
      this.updateList();

      // Re-position because height might have changed
      const coords = this.view.coordsAtPos(newPos);
      if (coords) {
        this.updatePosition(coords.left, coords.top);
      }
    }
  }

  handleKey(event: KeyboardEvent) {
    if (!this.active) {
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const { from } = this.view.state.selection.main;
        const line = this.view.state.doc.lineAt(from);
        const textBefore = this.view.state.sliceDoc(line.from, from);

        if (textBefore.length === 0 || /\s$/.test(textBefore)) {
          setTimeout(() => {
            const coords = this.view.coordsAtPos(from);
            if (coords) {
              this.show(coords.left, coords.top, from);
            } else {
              const domRect = this.view.contentDOM.getBoundingClientRect();
              this.show(domRect.left + 50, domRect.top + 50, from);
            }
          }, 50);
        }
      }
      return;
    }

    const itemCount = this.renderItems.length;

    // If active, INTERCEPT navigation keys
    switch (event.key) {
      case "ArrowDown":
        if (itemCount === 0) return; // Allow default behavior if empty?
        this.selectedIndex = (this.selectedIndex + 1) % itemCount;
        this.updateSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      case "ArrowUp":
        if (itemCount === 0) return;
        this.selectedIndex = (this.selectedIndex - 1 + itemCount) % itemCount;
        this.updateSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      case "Enter":
      case "Tab":
        if (itemCount > 0) {
          this.selectItem(this.selectedIndex);
          event.preventDefault();
          event.stopPropagation();
        } else {
          // Empy list, e.g. user typed a custom thing
          // Let Enter propagate -> insert newline
          // But we should probably close the palette?
          this.hide();
        }
        return;
      case "Escape":
        this.hide();
        event.preventDefault();
        event.stopPropagation();
        return;
    }
  }
}
