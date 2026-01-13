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
    border: '1px solid var(--border-color, #e2e8f0)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: 'var(--tooltip-bg, #ffffff)',
    padding: '4px',
    maxHeight: '320px',
    minWidth: '280px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: '13px',
    maxHeight: '300px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '8px 12px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--selection-bg, rgba(59, 130, 246, 0.15))',
    color: 'inherit'
  },
  '.cm-completionLabel': {
    fontWeight: '500',
    flex: '0 0 auto'
  },
  '.cm-completionDetail': {
    color: 'var(--gutter-color, #94a3b8)',
    fontSize: '12px',
    marginLeft: '12px',
    flex: '1 1 auto',
    textAlign: 'right'
  },
  '.cm-completionMatchedText': {
    color: 'var(--accent-color, #2563eb)',
    fontWeight: '600'
  },
  // Section headers
  '.cm-completionSection': {
    padding: '6px 12px 4px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--gutter-color, #94a3b8)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
});

// Dark theme overrides
const commandPaletteDarkTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': '#1e293b',
    '--border-color': '#334155',
    '--selection-bg': 'rgba(99, 102, 241, 0.25)',
    '--gutter-color': '#64748b',
    '--accent-color': '#60a5fa'
  }
}, { dark: true });

// Light theme overrides
const commandPaletteLightTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': '#ffffff',
    '--border-color': '#e2e8f0',
    '--selection-bg': 'rgba(59, 130, 246, 0.15)',
    '--gutter-color': '#94a3b8',
    '--accent-color': '#2563eb'
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
        const { from } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        const textBefore = view.state.sliceDoc(line.from, from);
        
        // Only trigger if at start of line or after whitespace
        if (textBefore.length === 0 || /\s$/.test(textBefore)) {
          // Insert the "/" and start completion
          view.dispatch({
            changes: { from, to: from, insert: '/' }
          });
          // Start completion after a small delay to let the "/" be inserted
          setTimeout(() => startCompletion(view), 10);
          return true;
        }
        return false;
      }
    }
  ]));
}

export { slashCommands };

