import SwiftUI
import WebKit

// MARK: - EditorConfiguration

/// Configuration options for customizing the Markdown editor appearance.
///
/// Use this to customize font size, font family, line height, and
/// whether to show line numbers.
///
/// ## Example
/// ```swift
/// let config = EditorConfiguration(
///     fontSize: 16,
///     fontFamily: "Menlo",
///     lineHeight: 1.8,
///     showLineNumbers: true
/// )
///
/// EditorWebView(text: $markdown, configuration: config)
/// ```
public struct EditorConfiguration: Codable, Equatable, Sendable {
    /// The font size in points.
    public var fontSize: CGFloat
    
    /// The CSS font-family string.
    public var fontFamily: String
    
    /// The line height multiplier (e.g., 1.6 for 160%).
    public var lineHeight: CGFloat
    
    /// Whether to show line numbers in the gutter.
    public var showLineNumbers: Bool
    
    /// Whether to wrap long lines.
    public var wrapLines: Bool
    
    /// Creates a new editor configuration.
    ///
    /// - Parameters:
    ///   - fontSize: The font size in points. Default is 15.
    ///   - fontFamily: The CSS font-family string. Default is system monospace.
    ///   - lineHeight: The line height multiplier. Default is 1.6.
    ///   - showLineNumbers: Whether to show line numbers. Default is true.
    public init(
        fontSize: CGFloat = 15,
        fontFamily: String = "-apple-system, BlinkMacSystemFont, 'SF Mono', Menlo, Monaco, monospace",
        lineHeight: CGFloat = 1.6,
        showLineNumbers: Bool = true,
        wrapLines: Bool = true
    ) {
        self.fontSize = fontSize
        self.fontFamily = fontFamily
        self.lineHeight = lineHeight
        self.showLineNumbers = showLineNumbers
        self.wrapLines = wrapLines
    }
    
    /// The default editor configuration.
    public static let `default` = EditorConfiguration()
}

// MARK: - EditorWebView

/// A SwiftUI view that displays a CodeMirror 6 Markdown editor.
///
/// `EditorWebView` wraps a WKWebView containing a CodeMirror 6 editor
/// configured for Markdown editing. It provides:
/// - Two-way binding with SwiftUI state
/// - Automatic light/dark theme switching
/// - Syntax highlighting for Markdown
/// - Keyboard shortcuts for formatting
///
/// ## Basic Usage
/// ```swift
/// struct ContentView: View {
///     @State private var markdown = "# Hello, World!"
///
///     var body: some View {
///         EditorWebView(text: $markdown)
///     }
/// }
/// ```
///
/// ## With Configuration
/// ```swift
/// EditorWebView(
///     text: $markdown,
///     configuration: EditorConfiguration(fontSize: 18),
///     onReady: {
///         print("Editor is ready!")
///     }
/// )
/// ```
///
/// ## Accessing the Bridge
/// For programmatic control, use the coordinator's bridge:
/// ```swift
/// // The bridge is available after editor is ready
/// await coordinator.bridge.toggleBold()
/// ```
public struct EditorWebView: NSViewRepresentable {
    
    // MARK: - Properties
    
    /// Binding to the Markdown content.
    @Binding public var text: String
    
    /// Configuration for editor appearance.
    public var configuration: EditorConfiguration
    
    /// Callback when the editor is ready for interaction.
    public var onReady: (() -> Void)?
    
    @Environment(\.colorScheme) private var colorScheme
    
    // MARK: - Initialization
    
    /// Creates a new Markdown editor view.
    ///
    /// - Parameters:
    ///   - text: Binding to the Markdown content string.
    ///   - configuration: Configuration for editor appearance. Default is `.default`.
    ///   - onReady: Optional callback when the editor is ready.
    public init(
        text: Binding<String>,
        configuration: EditorConfiguration = .default,
        onReady: (() -> Void)? = nil
    ) {
        self._text = text
        self.configuration = configuration
        self.onReady = onReady
    }
    
    // MARK: - NSViewRepresentable
    
    public func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        
        // Configure bridge
        context.coordinator.bridge.configure(with: webView)
        context.coordinator.bridge.delegate = context.coordinator
        context.coordinator.textBinding = _text
        context.coordinator.onReady = onReady
        context.coordinator.initialContent = text
        
        // Load editor HTML
        loadEditor(in: webView, theme: colorScheme == .dark ? .dark : .light)
        
        return webView
    }
    
    public func updateNSView(_ webView: WKWebView, context: Context) {
        let coordinator = context.coordinator
        
        // Update theme if changed
        let newTheme: EditorTheme = colorScheme == .dark ? .dark : .light
        if coordinator.currentTheme != newTheme {
            coordinator.currentTheme = newTheme
            Task { @MainActor in
                await coordinator.bridge.setTheme(newTheme)
            }
        }
        
        // Update configuration if changed
        if coordinator.currentConfiguration != configuration {
            coordinator.currentConfiguration = configuration
            Task { @MainActor in
                await coordinator.bridge.updateConfiguration(configuration)
            }
        }
        
        // Update content if changed externally (not from editor)
        if text != coordinator.lastKnownContent && !coordinator.isUpdatingBinding {
            coordinator.lastKnownContent = text
            Task { @MainActor in
                await coordinator.bridge.setContent(text)
            }
        }
    }
    
    public func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    public static func dismantleNSView(_ webView: WKWebView, coordinator: Coordinator) {
        coordinator.bridge.cleanup()
    }
    
    // MARK: - Private Methods
    
    private func loadEditor(in webView: WKWebView, theme: EditorTheme) {
        guard let htmlURL = Bundle.module.url(forResource: "editor", withExtension: "html") else {
            print("[EditorWebView] Could not find editor.html in bundle")
            return
        }
        
        // Use loadFileURL for better performance and sandbox handling.
        // We grant read access to the Resources directory.
        webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    }
    
    // MARK: - Coordinator
    
    /// Coordinator that manages the bridge and handles editor events.
    @MainActor
    public final class Coordinator: NSObject, EditorBridgeDelegate {
        /// The bridge for programmatic editor control.
        public let bridge = EditorBridge()
        
        var textBinding: Binding<String>?
        var onReady: (() -> Void)?
        var initialContent: String = ""
        var lastKnownContent: String = ""
        var currentTheme: EditorTheme = .light
        var currentConfiguration: EditorConfiguration = .default
        var isUpdatingBinding = false
        
        // MARK: - EditorBridgeDelegate
        
        public func editorDidChangeContent(_ content: String) {
            guard let binding = textBinding else { return }
            
            isUpdatingBinding = true
            lastKnownContent = content
            binding.wrappedValue = content
            isUpdatingBinding = false
        }
        
        public func editorDidBecomeReady() {
            if !initialContent.isEmpty {
                Task { @MainActor in
                    // Apply theme first
                    await bridge.setTheme(currentTheme)
                    // Then set content
                    await bridge.setContent(initialContent)
                    lastKnownContent = initialContent
                }
            } else {
                 Task { @MainActor in
                    await bridge.setTheme(currentTheme)
                 }
            }
            onReady?()
        }
        
        public func editorDidChangeSelection(_ selection: EditorSelection) {
            // Can be extended to track selection
        }
        
        public func editorDidFocus() {}
        public func editorDidBlur() {}
    }
}

// MARK: - Preview

#if DEBUG
#Preview {
    EditorPreview()
}

private struct EditorPreview: View {
    @State private var text = """
    # Hello, Markdown!
    
    This is a **bold** and *italic* text.
    
    ## Features
    
    - Live editing
    - Syntax highlighting
    - Keyboard shortcuts
    
    ```swift
    print("Hello, World!")
    ```
    """
    
    var body: some View {
        EditorWebView(text: $text)
            .frame(width: 600, height: 400)
    }
}
#endif
