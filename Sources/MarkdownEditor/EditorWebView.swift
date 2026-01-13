import SwiftUI
import WebKit

/// Configuration for the Markdown editor
public struct EditorConfiguration: Sendable {
    public var fontSize: CGFloat
    public var fontFamily: String
    public var lineHeight: CGFloat
    public var showLineNumbers: Bool
    
    public init(
        fontSize: CGFloat = 15,
        fontFamily: String = "-apple-system, BlinkMacSystemFont, 'SF Mono', Menlo, Monaco, monospace",
        lineHeight: CGFloat = 1.6,
        showLineNumbers: Bool = true
    ) {
        self.fontSize = fontSize
        self.fontFamily = fontFamily
        self.lineHeight = lineHeight
        self.showLineNumbers = showLineNumbers
    }
    
    public static let `default` = EditorConfiguration()
}

/// SwiftUI view wrapper for the CodeMirror 6 Markdown editor
public struct EditorWebView: NSViewRepresentable {
    
    // MARK: - Properties
    
    @Binding public var text: String
    public var configuration: EditorConfiguration
    public var onReady: (() -> Void)?
    
    @Environment(\.colorScheme) private var colorScheme
    
    // MARK: - Initialization
    
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
        
        do {
            var htmlContent = try String(contentsOf: htmlURL, encoding: .utf8)
            
            // Inject initial theme
            htmlContent = htmlContent.replacingOccurrences(
                of: "data-theme=\"light\"",
                with: "data-theme=\"\(theme.rawValue)\""
            )
            
            // Load the HTML
            webView.loadHTMLString(htmlContent, baseURL: htmlURL.deletingLastPathComponent())
        } catch {
            print("[EditorWebView] Failed to load editor.html: \(error)")
        }
    }
    
    // MARK: - Coordinator
    
    @MainActor
    public final class Coordinator: NSObject, EditorBridgeDelegate {
        let bridge = EditorBridge()
        var textBinding: Binding<String>?
        var onReady: (() -> Void)?
        var initialContent: String = ""
        var lastKnownContent: String = ""
        var currentTheme: EditorTheme = .light
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
            // Set initial content when editor is ready
            if !initialContent.isEmpty {
                Task { @MainActor in
                    await bridge.setContent(initialContent)
                    lastKnownContent = initialContent
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
