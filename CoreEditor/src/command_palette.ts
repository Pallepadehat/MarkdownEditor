import { EditorView } from '@codemirror/view';

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
  { label: 'Bold', detail: 'Make text bold', shortcut: '⌘B', section: 'Formatting', apply: () => window.editorAPI?.toggleBold() },
  { label: 'Italic', detail: 'Make text italic', shortcut: '⌘I', section: 'Formatting', apply: () => window.editorAPI?.toggleItalic() },
  { label: 'Strikethrough', detail: 'Strikethrough text', section: 'Formatting', apply: () => window.editorAPI?.toggleStrikethrough() },
  { label: 'Code', detail: 'Inline code', section: 'Formatting', apply: () => window.editorAPI?.toggleCode() },

  // Headings
  { label: 'Heading 1', detail: 'Large heading', section: 'Headings', apply: () => window.editorAPI?.insertHeading(1) },
  { label: 'Heading 2', detail: 'Medium heading', section: 'Headings', apply: () => window.editorAPI?.insertHeading(2) },
  { label: 'Heading 3', detail: 'Small heading', section: 'Headings', apply: () => window.editorAPI?.insertHeading(3) },
  
  // Lists
  { label: 'Bullet List', detail: 'Unordered list', section: 'Lists', apply: () => window.editorAPI?.insertList(false) },
  { label: 'Numbered List', detail: 'Ordered list', section: 'Lists', apply: () => window.editorAPI?.insertList(true) },
  { label: 'Task List', detail: 'Todo list', section: 'Lists', apply: (view) => {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const prefix = '- [ ] ';
    view.dispatch({ 
      changes: { from: line.from, to: line.from, insert: prefix },
      selection: { anchor: from + prefix.length }
    });
  }},

  // Blocks
  { label: 'Quote', detail: 'Blockquote', section: 'Blocks', apply: () => window.editorAPI?.insertBlockquote() },
  { label: 'Code Block', detail: 'Fenced code block', section: 'Blocks', apply: () => window.editorAPI?.insertCodeBlock() },
  { label: 'Divider', detail: 'Horizontal rule', section: 'Blocks', apply: () => window.editorAPI?.insertHorizontalRule() },
  
  // Media
  { label: 'Link', detail: 'Insert link', shortcut: '⌘K', section: 'Media', apply: () => window.editorAPI?.insertLink('') },
  { label: 'Image', detail: 'Insert image', shortcut: '⌘⇧K', section: 'Media', apply: () => window.editorAPI?.insertImage('') },
];

export class CommandPalette {
  private element: HTMLElement;
  private view: EditorView;
  private active: boolean = false;
  private selectedIndex: number = 0;
  private renderItems: CommandItem[] = [];
  private triggerPos: number = 0;

  constructor(view: EditorView) {
    this.view = view;
    this.element = document.createElement('div');
    this.element.className = 'command-palette';
    this.element.style.display = 'none';
    document.body.appendChild(this.element);

    // Initial styles
    const style = document.createElement('style');
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
        height: 36px;
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
        font-weight: 400;
      }

      .palette-detail {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.55);
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
    `;
    document.head.appendChild(style);

    // Initial render
    this.renderItems = commands;
    this.updateList();
    
    // Attach capture handler to intercept keys before CodeMirror
    this.view.dom.addEventListener('keydown', this.handleKey.bind(this), { capture: true });
  }
  
  setTheme(theme: 'light' | 'dark') {
    if (theme === 'light') {
      this.element.classList.add('light-theme');
    } else {
      this.element.classList.remove('light-theme');
    }
  }

  show(left: number, top: number, triggerPos: number) {
    console.log('[CommandPalette] Showing at', left, top);
    this.active = true;
    this.triggerPos = triggerPos;
    this.element.style.display = 'flex';
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top + 24}px`; // Below cursor
    this.selectedIndex = 0;
    this.updateSelection();
  }

  hide() {
    this.active = false;
    this.element.style.display = 'none';
  }

  updateList() {
    this.element.innerHTML = '';
    let currentSection = '';
    
    this.renderItems.forEach((item, index) => {
      if (item.section !== currentSection) {
        currentSection = item.section;
        const section = document.createElement('div');
        section.className = 'palette-section';
        section.textContent = currentSection;
        this.element.appendChild(section);
      }

      const el = document.createElement('div');
      el.className = 'palette-item';
      if (index === this.selectedIndex) el.classList.add('selected');
      el.innerHTML = `
        <span class="palette-label">${item.label}</span>
        <span class="palette-detail">${item.detail} ${item.shortcut ? ' ' + item.shortcut : ''}</span>
      `;
      el.onclick = () => this.selectItem(index);
      this.element.appendChild(el);
    });
  }

  updateSelection() {
    const items = this.element.querySelectorAll('.palette-item');
    items.forEach((el, index) => {
      if (index === this.selectedIndex) {
        el.classList.add('selected');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('selected');
      }
    });
  }

  selectItem(index: number) {
    const item = this.renderItems[index];
    if (!item) return;

    // Remove the "/" trigger char
    if (this.triggerPos >= 0) {
        const { from } = this.view.state.selection.main;
        // Verify if we are indeed after the slash
        this.view.dispatch({
            changes: { from: this.triggerPos, to: from, insert: '' }
        });
    }

    item.apply(this.view);
    this.hide();
  }

  handleUpdate(update: import('@codemirror/view').ViewUpdate) {
    if (!this.active) return;

    if (update.docChanged) {
      // Check if the trigger slash is still there
      // We need to map the triggerPos through the changes to see where it ended up
      const newPos = update.changes.mapPos(this.triggerPos);
      this.triggerPos = newPos; // Update our tracker
      
      const char = update.state.sliceDoc(newPos, newPos + 1);
      if (char !== '/') {
        this.hide();
        return;
      }
      
      // Also hide if the line changed significantly or cursor moved away?
      // For now, just validating the trigger slash exists is good specific behavior for "delete the / it will close"
    }
  }

  handleKey(event: KeyboardEvent) {
    if (!this.active) {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // ... (Keep existing logic but ensure we don't block typing / unless we triggered)
        // Actually, for the trigger we let it bubble so the / gets typed, 
        // then we show the palette.
        
        // We need to check context synchronously to decide if we pop up
        const { from } = this.view.state.selection.main;
        const line = this.view.state.doc.lineAt(from);
        const textBefore = this.view.state.sliceDoc(line.from, from);

        if (textBefore.length === 0 || /\s$/.test(textBefore)) {
           // It's a valid trigger.
           // We do NOT prevent default here because we want the '/' to appear.
           // We schedule the show.
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

    // If active, INTERCEPT navigation keys
    switch (event.key) {
      case 'ArrowDown':
        this.selectedIndex = (this.selectedIndex + 1) % this.renderItems.length;
        this.updateSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      case 'ArrowUp':
        this.selectedIndex = (this.selectedIndex - 1 + this.renderItems.length) % this.renderItems.length;
        this.updateSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      case 'Enter':
      case 'Tab':
        this.selectItem(this.selectedIndex);
        event.preventDefault();
        event.stopPropagation();
        return;
      case 'Escape':
        this.hide();
        event.preventDefault();
        event.stopPropagation();
        return;
    }
  }
}
