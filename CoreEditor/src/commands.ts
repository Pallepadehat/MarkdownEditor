/**
 * Slash Command Palette for Markdown Editor
 * Triggered by typing "/" at the start of a line or after whitespace
 */

import { 
  Completion,
  CompletionContext,
  CompletionResult,
  startCompletion
} from '@codemirror/autocomplete';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

// Command definition with label, description, shortcut, and action
interface SlashCommand {
  label: string;
  detail: string;
  shortcut?: string;
  info?: string;
  section: string;
  apply: (view: EditorView, completion: Completion, from: number, to: number) => void;
}

// All available slash commands
const slashCommands: SlashCommand[] = [
  // Text Formatting
  {
    label: 'bold',
    detail: 'Make text bold',
    shortcut: '⌘B',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleBold();
    }
  },
  {
    label: 'italic',
    detail: 'Make text italic',
    shortcut: '⌘I',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleItalic();
    }
  },
  {
    label: 'strikethrough',
    detail: 'Strikethrough text',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleStrikethrough();
    }
  },
  {
    label: 'code',
    detail: 'Inline code',
    shortcut: '⌘`',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleCode();
    }
  },

  // Headings
  {
    label: 'h1',
    detail: 'Heading 1',
    info: 'Large heading',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '# ' }
      });
    }
  },
  {
    label: 'h2',
    detail: 'Heading 2',
    info: 'Medium heading',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '## ' }
      });
    }
  },
  {
    label: 'h3',
    detail: 'Heading 3',
    info: 'Small heading',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '### ' }
      });
    }
  },
  {
    label: 'h4',
    detail: 'Heading 4',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '#### ' }
      });
    }
  },
  {
    label: 'h5',
    detail: 'Heading 5',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '##### ' }
      });
    }
  },
  {
    label: 'h6',
    detail: 'Heading 6',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '###### ' }
      });
    }
  },

  // Lists
  {
    label: 'bullet',
    detail: 'Bullet list',
    info: 'Unordered list item',
    section: 'Lists',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '- ' }
      });
    }
  },
  {
    label: 'numbered',
    detail: 'Numbered list',
    info: 'Ordered list item',
    section: 'Lists',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '1. ' }
      });
    }
  },
  {
    label: 'todo',
    detail: 'Task list',
    info: 'Checkbox item',
    section: 'Lists',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '- [ ] ' }
      });
    }
  },

  // Blocks
  {
    label: 'quote',
    detail: 'Blockquote',
    info: 'Quote text',
    section: 'Blocks',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '> ' }
      });
    }
  },
  {
    label: 'codeblock',
    detail: 'Code block',
    info: 'Fenced code block',
    section: 'Blocks',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '```\n\n```' },
        selection: { anchor: line.from + 4 }
      });
    }
  },
  {
    label: 'divider',
    detail: 'Horizontal rule',
    info: 'Separator line',
    section: 'Blocks',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '---\n' }
      });
    }
  },

  // Media & Links
  {
    label: 'link',
    detail: 'Insert link',
    shortcut: '⌘K',
    section: 'Media',
    apply: (view, _, from, to) => {
      view.dispatch({ 
        changes: { from, to, insert: '[](url)' },
        selection: { anchor: from + 1 }
      });
    }
  },
  {
    label: 'image',
    detail: 'Insert image',
    shortcut: '⌘⇧K',
    section: 'Media',
    apply: (view, _, from, to) => {
      view.dispatch({ 
        changes: { from, to, insert: '![alt text](url)' },
        selection: { anchor: from + 2, head: from + 10 }
      });
    }
  },
];

// Convert slash commands to completion items
function createCompletionItems(): Completion[] {
  return slashCommands.map(cmd => ({
    label: cmd.label,
    detail: cmd.shortcut ? `${cmd.detail}  ${cmd.shortcut}` : cmd.detail,
    info: cmd.info,
    section: cmd.section,
    type: 'keyword',
    apply: cmd.apply
  }));
}

/**
 * Slash command completion source
 */
export function slashCommandCompletion(context: CompletionContext): CompletionResult | null {
  // Look for "/" at the start of a line or after whitespace
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = context.state.sliceDoc(line.from, context.pos);
  
  // Check if we're in a slash command context
  const slashMatch = textBefore.match(/(?:^|\s)\/(\w*)$/);
  if (!slashMatch) return null;
  
  const matchStart = line.from + textBefore.lastIndexOf('/');
  const query = slashMatch[1].toLowerCase();
  
  // Filter commands based on query
  const items = createCompletionItems();
  const filtered = query 
    ? items.filter(item => item.label.toLowerCase().includes(query))
    : items;
  
  return {
    from: matchStart,
    to: context.pos,
    options: filtered,
    filter: false // We already filtered
  };
}

// Custom styling for the command palette
const commandPaletteTheme = EditorView.baseTheme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: '0.5px solid var(--border-color, rgba(0,0,0,0.1))',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.95))',
    backdropFilter: 'blur(20px)',
    '-webkit-backdrop-filter': 'blur(20px)',
    padding: '6px',
    maxHeight: '320px',
    minWidth: '300px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    fontSize: '13px',
    maxHeight: '300px',
    gap: '2px',
    display: 'flex',
    flexDirection: 'column'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '8px 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.1s ease',
    margin: '0 2px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--selection-bg, #007AFF)',
    color: 'var(--selection-text, #ffffff)'
  },
  '.cm-completionLabel': {
    fontWeight: '500',
    flex: '0 0 auto'
  },
  '.cm-completionDetail': {
    color: 'var(--detail-color, #8e8e93)',
    fontSize: '12px',
    marginLeft: '12px',
    flex: '1 1 auto',
    textAlign: 'right',
    opacity: '0.8'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail': {
    color: 'rgba(255,255,255,0.8)'
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: '700'
  },
  // Section headers
  '.cm-completionSection': {
    padding: '8px 14px 4px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--section-color, #8e8e93)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
    borderTop: '1px solid var(--divider-color, rgba(0,0,0,0.05))'
  },
  '.cm-completionSection:first-child': {
    marginTop: '0',
    borderTop: 'none'
  }
});

// Dark theme overrides
const commandPaletteDarkTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': 'rgba(30, 30, 30, 0.85)',
    '--border-color': 'rgba(255,255,255,0.1)',
    '--selection-bg': '#0A84FF',
    '--selection-text': '#ffffff',
    '--detail-color': '#98989d',
    '--section-color': '#86868b',
    '--divider-color': 'rgba(255,255,255,0.1)'
  }
}, { dark: true });

// Light theme overrides
const commandPaletteLightTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': 'rgba(255, 255, 255, 0.85)',
    '--border-color': 'rgba(0,0,0,0.1)',
    '--selection-bg': '#007AFF',
    '--selection-text': '#ffffff',
    '--detail-color': '#8e8e93',
    '--section-color': '#6e6e73',
    '--divider-color': 'rgba(0,0,0,0.05)'
  }
}, { dark: false });

/**
 * Returns the themes for the command palette
 */
export function commandPaletteThemes(): Extension[] {
  return [
    commandPaletteTheme,
    commandPaletteLightTheme,
    commandPaletteDarkTheme
  ];
}

/**
 * Returns the keymap to trigger the command palette
 */
export function slashCommandKeymap(): Extension {
  return Prec.high(keymap.of([
    {
      key: '/',
      run: (view) => {
        const { from, to } = view.state.selection.main;
        if (from !== to) return false; // Don't trigger on selection replacement

        const line = view.state.doc.lineAt(from);
        const textBefore = view.state.sliceDoc(line.from, from);
        
        // Only trigger if at start of line or after whitespace
        if (textBefore.length === 0 || /\s$/.test(textBefore)) {
          // Insert the "/" and EXPLICITLY set selection to be after it
          view.dispatch({
            changes: { from, to: from, insert: '/' },
            selection: { anchor: from + 1 }, // Ensure cursor moves forward
            scrollIntoView: true
          });
          // Start completion after a small delay to let the "/" be inserted and rendered
          setTimeout(() => startCompletion(view), 20);
          return true;
        }
        return false;
      }
    }
  ]));
}

export { slashCommands };

