# MarkdownEditor

MarkdownEditor is a native-feeling Markdown editing component for macOS, built with SwiftUI and CodeMirror 6. It provides a premium editing experience with syntax highlighting, live formatting updates, and a comprehensive Swift API.

## Features

- **Native Aesthetics**: Designed to match the look and feel of macOS (Xcode-inspired light/dark themes).
- **Mermaid Diagrams**: Native support for rendering and resizing Mermaid diagrams live in the editor.
- **KaTeX Math**: Render inline (`$...$`) and block (`$$...$$`) math formulas with full LaTeX support.
- **Syntax Hiding**: Obsidian-style interaction that hides markdown markers on inactive lines.
- **Command Palette**: Built-in command palette triggered by `/` for quick insertions and formatting.
- **Premium Code Blocks**: Code blocks feature language badges and distinct backgrounds.
- **Inline Images**: Render and resize images directly in the editor.
- **Smart Calculator**: Inline math evaluation inside `$...$` blocks (e.g., `$2+2=` shows `4`).
- **Typesafe Configuration**: Configure fonts, line numbers, wrapping, themes, and feature toggles via Swift API.
- **Two-Way Binding**: Seamless SwiftUI integration via `Binding<String>`.

### v0.2.0 Highlights

- **Modular Architecture**: CoreEditor restructured into logical modules (`core/`, `bridge/`, `extensions/`, `widgets/`, `ui/`, `utils/`).
- **Lazy Loading**: Mermaid (~2.4MB) and KaTeX (~600KB) are now lazy-loaded, reducing initial bundle size by **22%**.
- **Widget Caching**: LRU cache for widgets prevents redundant re-creation.
- **Smart Debouncing**: Uses `requestIdleCallback` for non-critical updates.
- **Theme-Aware Widgets**: Math and diagram widgets properly update when switching themes.

## Installation

### Swift Package Manager

Add MarkdownEditor to your project:

```swift
dependencies: [
    .package(url: "https://github.com/Pallepadehat/MarkdownEditor.git", from: "0.2.0")
]
```

## Setup & App Sandbox

To ensure the editor functions correctly within the macOS App Sandbox, configure your entitlements:

### Required Entitlements

In Xcode (Signing & Capabilities):

1. **Incoming Connections (Server)**: ❌ **Uncheck** (not required, may cause App Store rejections).
2. **Outgoing Connections (Client)**: ✅ **Check** (mandatory for WKWebView XPC communication).
3. **Allow Execution of JIT-compiled Code**: ✅ **Check** (under Hardened Runtime).

### Troubleshooting Sandbox Logs

Logs like `XPC_ERROR_CONNECTION_INVALID` or `Sandbox restriction` are usually harmless WebKit noise. To minimize:

1. **Run in Release Mode**: Debug builds enable developer extras.
2. **Verify Entitlements**: Ensure Outgoing Connections is checked.
3. **Clean Build Folder**: `Product > Clean Build Folder` (Cmd+Shift+K).

## Usage

### Basic Implementation

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

### Configuration

Customize the editor's appearance and features:

```swift
let config = EditorConfiguration(
    fontSize: 14,
    fontFamily: "Menlo",
    lineHeight: 1.5,
    showLineNumbers: true,
    wrapLines: true,
    theme: .light,           // .light or .dark
    renderMermaid: true,     // Enable Mermaid diagrams
    renderMath: true,        // Enable KaTeX math
    renderImages: true,      // Enable inline images
    hideSyntax: true         // Enable Obsidian-style syntax hiding
)

EditorWebView(
    text: $content,
    configuration: config,
    onReady: {
        print("Editor is ready")
    }
)
```

### Available Configuration Options

| Option            | Type     | Default  | Description                           |
| ----------------- | -------- | -------- | ------------------------------------- |
| `fontSize`        | `Int`    | `15`     | Font size in pixels                   |
| `fontFamily`      | `String` | System   | CSS font family                       |
| `lineHeight`      | `Double` | `1.8`    | Line height multiplier                |
| `showLineNumbers` | `Bool`   | `true`   | Show gutter line numbers              |
| `wrapLines`       | `Bool`   | `true`   | Wrap long lines                       |
| `theme`           | `Theme`  | `.light` | Color theme                           |
| `renderMermaid`   | `Bool`   | `true`   | Render Mermaid diagrams               |
| `renderMath`      | `Bool`   | `true`   | Render KaTeX math                     |
| `renderImages`    | `Bool`   | `true`   | Render inline images                  |
| `hideSyntax`      | `Bool`   | `true`   | Hide syntax markers on inactive lines |

## Contributing

This project uses a hybrid architecture:

- **CoreEditor/**: TypeScript (CodeMirror 6) source code
- **Sources/MarkdownEditor/**: Swift wrapper for macOS integration

### CoreEditor Structure (v0.2.0+)

```
CoreEditor/src/
├── index.ts          # Entry point
├── core/             # Editor initialization, state, API
├── bridge/           # Swift ↔ JS communication
├── extensions/       # CodeMirror extensions, keymaps, formatting
├── widgets/          # Mermaid, Math, Images, Syntax hiding
├── ui/               # Command palette, themes
└── utils/            # Debounce, DOM helpers
```

### Prerequisites

- **Bun**: `curl -fsSL https://bun.sh/install | bash`
- **Xcode 15+**

### Development Workflow

```bash
# Install dependencies
cd CoreEditor && bun install

# Development server with hot reload
bun run dev

# Build for production
bun run build
```

## License

This project is licensed under the MIT License.
