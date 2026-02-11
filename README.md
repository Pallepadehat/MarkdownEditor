# MarkdownEditor

A native Markdown editing component for macOS, built with SwiftUI and CodeMirror 6. MarkdownEditor delivers a premium editing experience with live syntax highlighting, rich widget rendering, and seamless Swift integration.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [App Sandbox Setup](#app-sandbox-setup)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Bug Reports and Issues](#bug-reports-and-issues)
- [License](#license)

## Features

### Core Editing

- **Native macOS Aesthetics**: Xcode-inspired light and dark themes that automatically follow system appearance
- **Two-Way SwiftUI Binding**: Seamless integration with SwiftUI state via `Binding<String>`
- **Live Syntax Highlighting**: Full Markdown syntax highlighting powered by CodeMirror 6
- **Keyboard Shortcuts**: Standard formatting shortcuts (Cmd+B for bold, Cmd+I for italic, etc.)

### Rich Content Rendering

- **Mermaid Diagrams**: Live rendering of flowcharts, sequence diagrams, and other Mermaid diagram types with resize handles
- **KaTeX Math**: Full LaTeX math support for inline (`$...$`) and block (`$$...$$`) formulas
- **Inline Images**: Render and resize images directly within the editor
- **Premium Code Blocks**: Syntax-highlighted code blocks with language badges and distinct backgrounds

### Advanced Features

- **Syntax Hiding**: Obsidian-style interaction that hides Markdown markers on inactive lines for a cleaner writing experience
- **Command Palette**: Built-in command palette triggered by `/` for quick insertions, formatting, and navigation
- **Smart Calculator**: Inline math evaluation inside `$...$` blocks (e.g., typing `$2+2=` displays `4`)
- **Typesafe Configuration**: Full Swift API for configuring fonts, themes, line numbers, and feature toggles

### Performance

- **Lazy Loading**: Mermaid and KaTeX libraries are loaded on-demand, reducing initial bundle size by 22%
- **Widget Caching**: LRU cache prevents redundant widget re-creation
- **Smart Debouncing**: Uses `requestIdleCallback` for non-critical updates
- **Theme-Aware Widgets**: Math and diagram widgets properly update when switching between light and dark themes

## Requirements

- macOS 14.0 or later
- Xcode 15 or later
- Swift 5.9 or later

## Installation

### Swift Package Manager

Add MarkdownEditor to your project's `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/Pallepadehat/MarkdownEditor.git", from: "1.0.0")
]
```

Then add `MarkdownEditor` to your target's dependencies:

```swift
.target(
    name: "YourApp",
    dependencies: ["MarkdownEditor"]
)
```

Alternatively, in Xcode:

1. Go to File > Add Package Dependencies
2. Enter the repository URL: `https://github.com/Pallepadehat/MarkdownEditor.git`
3. Select version 1.0.0 or later
4. Add to your target

## Quick Start

### Basic Usage

```swift
import SwiftUI
import MarkdownEditor

struct ContentView: View {
    @State private var content = "# Hello World"

    var body: some View {
        EditorWebView(text: $content)
            .frame(minWidth: 400, minHeight: 300)
    }
}
```

### Using the Type Alias

The package provides a convenience type alias for discoverable naming:

```swift
import MarkdownEditor

struct ContentView: View {
    @State private var markdown = ""

    var body: some View {
        MarkdownEditorView(text: $markdown)
    }
}
```

### With Configuration and Ready Callback

```swift
let config = EditorConfiguration(
    fontSize: 16,
    fontFamily: "Menlo",
    lineHeight: 1.6,
    showLineNumbers: true,
    wrapLines: true,
    renderMermaid: true,
    renderMath: true,
    renderImages: true,
    hideSyntax: true
)

EditorWebView(
    text: $content,
    configuration: config,
    onReady: {
        print("Editor is ready for interaction")
    }
)
```

## Configuration

### EditorConfiguration

The `EditorConfiguration` struct provides type-safe configuration for all editor settings:

| Option            | Type      | Default          | Description                                  |
| ----------------- | --------- | ---------------- | -------------------------------------------- |
| `fontSize`        | `CGFloat` | `15`             | Font size in points                          |
| `fontFamily`      | `String`  | System monospace | CSS font-family string                       |
| `lineHeight`      | `CGFloat` | `1.6`            | Line height multiplier                       |
| `showLineNumbers` | `Bool`    | `true`           | Display line numbers in the gutter           |
| `wrapLines`       | `Bool`    | `true`           | Wrap long lines instead of horizontal scroll |
| `renderMermaid`   | `Bool`    | `true`           | Enable live Mermaid diagram rendering        |
| `renderMath`      | `Bool`    | `true`           | Enable KaTeX math formula rendering          |
| `renderImages`    | `Bool`    | `true`           | Enable inline image rendering                |
| `hideSyntax`      | `Bool`    | `true`           | Hide Markdown syntax on inactive lines       |

### Using Default Configuration

```swift
// Uses all default values
EditorWebView(text: $content, configuration: .default)
```

### Dynamic Configuration Updates

Configuration changes are automatically applied when the SwiftUI view updates:

```swift
struct EditorView: View {
    @State private var content = ""
    @State private var showLineNumbers = true

    var body: some View {
        EditorWebView(
            text: $content,
            configuration: EditorConfiguration(
                showLineNumbers: showLineNumbers
            )
        )

        Toggle("Show Line Numbers", isOn: $showLineNumbers)
    }
}
```

## App Sandbox Setup

MarkdownEditor uses WKWebView internally, which requires specific entitlements when running in the macOS App Sandbox.

### Required Entitlements

In Xcode (Signing and Capabilities > App Sandbox):

1. **Outgoing Connections (Client)**: Enable this setting. Required for WKWebView XPC communication.
2. **Incoming Connections (Server)**: Leave disabled. Not required and may cause App Store submission issues.

### Hardened Runtime

If using Hardened Runtime (Signing and Capabilities > Hardened Runtime):

1. **Allow Execution of JIT-compiled Code**: Enable this setting if you encounter JavaScript execution issues.

### Troubleshooting

**Sandbox-related console logs**: Messages like `XPC_ERROR_CONNECTION_INVALID` or `Sandbox restriction` are typically harmless WebKit noise. To minimize:

- Run in Release mode rather than Debug
- Verify Outgoing Connections is enabled
- Clean Build Folder (Cmd+Shift+K)

## Architecture

MarkdownEditor uses a hybrid architecture combining Swift and TypeScript:

```
MarkdownEditor/
├── Sources/MarkdownEditor/           # Swift package
│   ├── EditorWebView.swift           # Main SwiftUI view
│   ├── EditorBridge.swift            # Swift-JS communication
│   ├── MarkdownEditor.swift          # Package exports
│   └── Resources/                    # Bundled editor HTML
│
├── CoreEditor/                       # TypeScript source
│   └── src/
│       ├── index.ts                  # Entry point
│       ├── core/                     # Editor initialization and state
│       ├── bridge/                   # Swift-JS message protocol
│       ├── extensions/               # CodeMirror extensions
│       │   ├── formatting.ts         # Bold, italic, lists, etc.
│       │   ├── keymaps.ts            # Keyboard shortcuts
│       │   └── calc.ts               # Smart calculator
│       ├── widgets/                  # Rich content widgets
│       │   ├── mermaid.ts            # Diagram rendering
│       │   ├── math.ts               # KaTeX rendering
│       │   ├── images.ts             # Inline images
│       │   └── syntax-hiding.ts      # Obsidian-style hiding
│       ├── ui/                       # Command palette and themes
│       └── utils/                    # Debounce and DOM helpers
│
└── Package.swift                     # Swift package manifest
```

### Key Components

- **EditorWebView**: The main SwiftUI view that hosts the WKWebView
- **EditorBridge**: Handles bidirectional communication between Swift and JavaScript
- **EditorConfiguration**: Type-safe configuration struct
- **CoreEditor**: CodeMirror 6 editor implementation in TypeScript

## Contributing

Contributions are welcome. This project uses a hybrid Swift/TypeScript architecture, so contributions may involve one or both languages.

### Prerequisites

- Xcode 15 or later
- Bun (for TypeScript development): `curl -fsSL https://bun.sh/install | bash`

### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Pallepadehat/MarkdownEditor.git
   cd MarkdownEditor
   ```

2. Install CoreEditor dependencies:

   ```bash
   cd CoreEditor
   bun install
   ```

3. Start the development server with hot reload:

   ```bash
   bun run dev
   ```

4. Build for production:

   ```bash
   bun run build
   ```

5. Open `Package.swift` in Xcode to work on the Swift code

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run the build to ensure everything compiles: `bun run build` in CoreEditor
5. Test your changes in a sample macOS app
6. Commit with clear, descriptive messages
7. Push to your fork and open a pull request

### Code Style

- **Swift**: Follow Swift API Design Guidelines
- **TypeScript**: Follow the existing TypeScript style patterns used in `CoreEditor/src`

## Bug Reports and Issues

Found a bug or have a feature request? Please open an issue on GitHub.

### Before Opening an Issue

1. Check existing issues to avoid duplicates
2. Use the latest version of MarkdownEditor
3. Include reproduction steps if reporting a bug

### Issue Template

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Minimal steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: macOS version, Xcode version, MarkdownEditor version
- **Code Sample**: If applicable, minimal code that demonstrates the issue

### Feature Requests

For feature requests, describe:

- The use case or problem you are trying to solve
- Your proposed solution (if any)
- Any alternatives you have considered

Open an issue at: https://github.com/Pallepadehat/MarkdownEditor/issues

## License

[MIT](LICENSE)
