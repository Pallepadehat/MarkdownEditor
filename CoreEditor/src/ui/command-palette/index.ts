/**
 * Command palette for the Markdown editor.
 *
 * A premium, macOS-native command palette triggered by '/'.
 */

import type { EditorView, ViewUpdate } from "@codemirror/view";
import { createElement } from "../../utils/dom";
import { injectStyles } from "../../utils/dom";
import { commands, CommandItem } from "./commands";
import { paletteStyles } from "./styles";

export { CommandItem } from "./commands";

/**
 * Command palette overlay triggered by '/'.
 */
export class CommandPalette {
  private element: HTMLElement;
  private view: EditorView;
  private active = false;
  private selectedIndex = 0;
  private renderItems: CommandItem[] = [];
  private triggerPos = 0;
  private placement: "top" | "bottom" = "bottom";
  private cleanupStyles: (() => void) | null = null;

  constructor(view: EditorView) {
    this.view = view;
    this.element = createElement("div");
    this.element.className = "command-palette";
    this.element.style.display = "none";
    document.body.appendChild(this.element);

    // Inject styles
    this.cleanupStyles = injectStyles(paletteStyles, "command-palette-styles");

    this.renderItems = commands;
    this.updateList();

    // Capture phase handler
    this.view.dom.addEventListener("keydown", this.handleKey.bind(this), {
      capture: true,
    });
  }

  setTheme(theme: "light" | "dark") {
    this.element.classList.toggle("light-theme", theme === "light");
  }

  show(left: number, top: number, triggerPos: number) {
    this.active = true;
    this.triggerPos = triggerPos;
    this.element.style.display = "flex";
    this.selectedIndex = 0;
    this.renderItems = commands;
    this.updateList();

    // Determine placement
    const viewportHeight = window.innerHeight;
    const maxHeight = 400;
    this.placement = "bottom";

    if (top + 24 + maxHeight > viewportHeight - 10) {
      if (top - maxHeight - 10 > 0) {
        this.placement = "top";
      }
    }

    this.updatePosition(left, top);
  }

  private updatePosition(left: number, top: number) {
    const paletteWidth = 332;
    const paletteHeight = this.element.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = left;
    let y = 0;

    // Horizontal fit
    if (x + paletteWidth > viewportWidth - 20) {
      x = viewportWidth - paletteWidth - 20;
    }
    if (x < 20) x = 20;

    // Vertical fit
    y = this.placement === "top" ? top - paletteHeight - 10 : top + 24;

    // Safety bounds
    if (
      y + paletteHeight > viewportHeight - 10 &&
      this.placement === "bottom"
    ) {
      y = viewportHeight - paletteHeight - 10;
    }
    if (y < 10 && this.placement === "top") y = 10;

    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  hide() {
    this.active = false;
    this.element.style.display = "none";
  }

  private updateList() {
    this.element.innerHTML = "";

    if (this.renderItems.length === 0) {
      const noResults = createElement("div");
      noResults.className = "palette-no-results";
      noResults.textContent = "No matching commands";
      this.element.appendChild(noResults);
      return;
    }

    let currentSection = "";

    this.renderItems.forEach((item, index) => {
      if (item.section !== currentSection) {
        currentSection = item.section;
        const section = createElement("div");
        section.className = "palette-section";
        section.textContent = currentSection;
        this.element.appendChild(section);
      }

      const el = createElement("div");
      el.className = "palette-item";
      if (index === this.selectedIndex) el.classList.add("selected");
      el.innerHTML = `
        <span class="palette-label">${item.label}</span>
        <span class="palette-detail">${item.detail}${
        item.shortcut ? " " + item.shortcut : ""
      }</span>
      `;
      el.onclick = () => this.selectItem(index);
      this.element.appendChild(el);
    });
  }

  private updateSelection() {
    const items = this.element.querySelectorAll(".palette-item");
    items.forEach((el, index) => {
      el.classList.toggle("selected", index === this.selectedIndex);
      if (index === this.selectedIndex) {
        el.scrollIntoView({ block: "nearest" });
      }
    });
  }

  private selectItem(index: number) {
    const item = this.renderItems[index];
    if (!item) return;

    // Remove trigger + query
    const { from } = this.view.state.selection.main;
    if (this.triggerPos >= 0 && from >= this.triggerPos) {
      this.view.dispatch({
        changes: { from: this.triggerPos, to: from, insert: "" },
      });
    }

    item.apply(this.view);
    this.hide();
  }

  handleUpdate(update: ViewUpdate) {
    if (!this.active) return;

    if (update.docChanged || update.selectionSet) {
      const newPos = update.changes.mapPos(this.triggerPos);
      this.triggerPos = newPos;

      const { from } = this.view.state.selection.main;

      // Close if cursor moved before trigger
      if (from < newPos) {
        this.hide();
        return;
      }

      // Close if trigger was deleted
      const char = update.state.sliceDoc(newPos, newPos + 1);
      if (char !== "/") {
        this.hide();
        return;
      }

      // Filter by query
      const query = update.state.sliceDoc(newPos + 1, from).toLowerCase();
      this.renderItems = query
        ? commands.filter(
            (c) =>
              c.label.toLowerCase().includes(query) ||
              c.section.toLowerCase().includes(query) ||
              (c.shortcut && c.shortcut.toLowerCase().includes(query))
          )
        : commands;

      this.selectedIndex = 0;
      this.updateList();

      const coords = this.view.coordsAtPos(newPos);
      if (coords) this.updatePosition(coords.left, coords.top);
    }
  }

  private handleKey(event: KeyboardEvent) {
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
              const rect = this.view.contentDOM.getBoundingClientRect();
              this.show(rect.left + 50, rect.top + 50, from);
            }
          }, 50);
        }
      }
      return;
    }

    const count = this.renderItems.length;

    switch (event.key) {
      case "ArrowDown":
        if (count === 0) return;
        this.selectedIndex = (this.selectedIndex + 1) % count;
        this.updateSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      case "ArrowUp":
        if (count === 0) return;
        this.selectedIndex = (this.selectedIndex - 1 + count) % count;
        this.updateSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      case "Enter":
      case "Tab":
        if (count > 0) {
          this.selectItem(this.selectedIndex);
          event.preventDefault();
          event.stopPropagation();
        } else {
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

  destroy() {
    this.cleanupStyles?.();
    this.element.remove();
  }
}
