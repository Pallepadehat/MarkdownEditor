/**
 * Command definitions for the command palette.
 */

import type { EditorView } from "@codemirror/view";

export interface CommandItem {
  label: string;
  detail: string;
  shortcut?: string;
  section: string;
  apply: (view: EditorView) => void;
}

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
        "```mermaid\nclassDiagram\n  Animal <|-- Duck\n  Animal : +int age\n  class Duck{\n    +swim()\n  }\n```"
      ),
  },
  {
    label: "Mindmap",
    detail: "Mindmap diagram",
    section: "Diagrams",
    apply: () =>
      window.editorAPI?.insertText(
        "```mermaid\nmindmap\n  root((mindmap))\n    Origins\n    Research\n```"
      ),
  },

  // Math
  {
    label: "Quadratic Formula",
    detail: "Algebra",
    section: "Math",
    apply: () =>
      window.editorAPI?.insertText(
        "$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$"
      ),
  },
  {
    label: "Pythagorean Theorem",
    detail: "Geometry",
    section: "Math",
    apply: () => window.editorAPI?.insertText("$$ a^2 + b^2 = c^2 $$"),
  },
  {
    label: "Summation",
    detail: "Sigma notation",
    section: "Math",
    apply: () =>
      window.editorAPI?.insertText(
        "$$ \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} $$"
      ),
  },
  {
    label: "Integration",
    detail: "Calculus",
    section: "Math",
    apply: () => window.editorAPI?.insertText("$$ \\int_{a}^{b} f(x) \\,dx $$"),
  },
  {
    label: "Euler's Identity",
    detail: "Complex Analysis",
    section: "Math",
    apply: () => window.editorAPI?.insertText("$$ e^{i\\pi} + 1 = 0 $$"),
  },
];
