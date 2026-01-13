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

/**
 * Definition of a slash command.
 */
interface SlashCommand {
  /** Label displayed in the completion list. */
  label: string;
  /** Description or preview of the command. */
  detail: string;
  /** Optional keyboard shortcut to display. */
  shortcut?: string;
  /** Optional additional info (right-aligned). */
  info?: string;
  /** Section header for grouping. */
  section: string;
  /** Function to execute when the command is selected. */
  apply: (view: EditorView, completion: Completion, from: number, to: number) => void;
}

// All available slash commands
const slashCommands: SlashCommand[] = [
  // -- Text Formatting --
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
 * CodeMirror completion source for slash commands.
 * Triggered by typing "/" at the start of a line or after whitespace.
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
    border: '0.5px solid var(--border-color)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0,0,0,0.04)', // Softer, more diffuse shadow
    backgroundColor: 'var(--tooltip-bg)',
    backdropFilter: 'blur(24px) saturate(180%)', // Standard macOS glass effect
    '-webkit-backdrop-filter': 'blur(24px) saturate(180%)',
    padding: '4px', // Tighter padding for outer container
    maxHeight: '320px',
    minWidth: '280px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    fontSize: '13px',
    maxHeight: '310px',
    gap: '1px', // Tiny gap between items
    display: 'flex',
    flexDirection: 'column',
    listStyle: 'none',
    margin: '0',
    padding: '0 4px 4px 4px' // Padding inside the scrollable area
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '6px 10px 6px 8px', // Balanced padding
    borderRadius: '6px', // Slightly smaller radius for items
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0s', // Instant selection change is more native-like
    margin: '0',
    lineHeight: '1.4',
    minHeight: '26px',
    cursor: 'default'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--selection-bg)',
    color: 'var(--selection-text)'
  },
  '.cm-completionLabel': {
    fontWeight: '400', // Normal weight looks cleaner
    fontSize: '13.5px', // Slightly larger for readability
    flex: '0 0 auto',
    letterSpacing: '-0.01em'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionLabel': {
    fontWeight: '500' // Slight bold on selection
  },
  '.cm-completionDetail': {
    color: 'var(--detail-color)',
    fontSize: '12px',
    marginLeft: '12px',
    flex: '1 1 auto',
    textAlign: 'right',
    opacity: '0.7',
    fontVariantNumeric: 'tabular-nums'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail': {
    color: 'rgba(255,255,255,0.85)',
    opacity: '1'
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: '600',
    color: 'var(--accent-color)' // Use accent color for matches in unselected items
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionMatchedText': {
    color: 'inherit' // White in selection
  },
  // Section headers
  '.cm-completionSection': {
    padding: '8px 10px 4px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--section-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginTop: '6px',
    marginBottom: '2px',
    borderTop: '1px solid var(--divider-color)'
  },
  '.cm-completionSection:first-child': {
    marginTop: '2px',
    borderTop: 'none'
  },
  // Scrollbar styling
  '.cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar': {
    width: '10px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--scrollbar-thumb)',
    borderRadius: '10px',
    border: '3px solid transparent',
    backgroundClip: 'content-box'
  }
});

// Dark theme overrides
const commandPaletteDarkTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': 'rgba(30, 30, 30, 0.75)', // More translucent
    '--border-color': 'rgba(255,255,255,0.12)',
    '--selection-bg': '#0061e8', // System Blue
    '--selection-text': '#ffffff',
    '--detail-color': 'rgba(235, 235, 245, 0.6)',
    '--section-color': 'rgba(235, 235, 245, 0.4)',
    '--divider-color': 'rgba(84, 84, 88, 0.5)',
    '--accent-color': '#0a84ff',
    '--scrollbar-thumb': 'rgba(255, 255, 255, 0.3)'
  }
}, { dark: true });

// Light theme overrides
const commandPaletteLightTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': 'rgba(255, 255, 255, 0.85)',
    '--border-color': 'rgba(0,0,0,0.1)', // Subtle border
    '--selection-bg': '#007AFF',
    '--selection-text': '#ffffff',
    '--detail-color': 'rgba(60, 60, 67, 0.6)',
    '--section-color': 'rgba(60, 60, 67, 0.4)',
    '--divider-color': 'rgba(60, 60, 67, 0.1)',
    '--accent-color': '#007AFF', // System Blue
    '--scrollbar-thumb': 'rgba(0, 0, 0, 0.2)'
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

