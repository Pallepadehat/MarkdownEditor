import Foundation
import WebKit

/// Message types received from JavaScript
public enum EditorMessageType: String, Codable {
    case contentChanged
    case selectionChanged
    case ready
    case focus
    case blur
}

/// Selection range in the editor
public struct EditorSelection: Sendable {
    public let from: Int
    public let to: Int
    
    public var isEmpty: Bool { from == to }
    public var length: Int { to - from }
}

/// Delegate protocol for editor events
@MainActor
public protocol EditorBridgeDelegate: AnyObject {
    func editorDidChangeContent(_ content: String)
    func editorDidChangeSelection(_ selection: EditorSelection)
    func editorDidBecomeReady()
    func editorDidFocus()
    func editorDidBlur()
}

/// Default implementations
public extension EditorBridgeDelegate {
    func editorDidChangeSelection(_ selection: EditorSelection) {}
    func editorDidBecomeReady() {}
    func editorDidFocus() {}
    func editorDidBlur() {}
}

/// Bridge between Swift and JavaScript editor
@MainActor
public final class EditorBridge: NSObject {
    
    // MARK: - Properties
    
    public weak var delegate: EditorBridgeDelegate?
    private weak var webView: WKWebView?
    
    /// Whether the editor has finished loading and is ready
    public private(set) var isReady = false
    
    /// Current content of the editor (cached)
    private var cachedContent: String = ""
    
    /// Flag to prevent feedback loops when setting content from Swift
    private var isUpdatingFromSwift = false
    
    // MARK: - Initialization
    
    public override init() {
        super.init()
    }
    
    /// Configure the bridge with a web view
    public func configure(with webView: WKWebView) {
        self.webView = webView
        
        // Add message handler
        webView.configuration.userContentController.add(
            LeakAvoider(delegate: self),
            name: "editor"
        )
    }
    
    /// Clean up message handlers
    public func cleanup() {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "editor")
    }
    
    // MARK: - Content Management
    
    /// Get current editor content
    public func getContent() async throws -> String {
        guard let webView, isReady else { return cachedContent }
        
        let result = try await webView.evaluateJavaScript("window.editorAPI.getContent()")
        return result as? String ?? ""
    }
    
    /// Set editor content
    public func setContent(_ content: String) async {
        guard let webView, isReady else {
            cachedContent = content
            return
        }
        
        isUpdatingFromSwift = true
        defer { isUpdatingFromSwift = false }
        
        let escaped = content
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
            .replacingOccurrences(of: "\t", with: "\\t")
        
        do {
            _ = try await webView.evaluateJavaScript("window.editorAPI.setContent(\"\(escaped)\")")
            cachedContent = content
        } catch {
            print("[EditorBridge] Failed to set content: \(error)")
        }
    }
    
    // MARK: - Selection
    
    /// Get current selection
    public func getSelection() async throws -> EditorSelection {
        guard let webView, isReady else { return EditorSelection(from: 0, to: 0) }
        
        let result = try await webView.evaluateJavaScript("window.editorAPI.getSelection()")
        if let dict = result as? [String: Any],
           let from = dict["from"] as? Int,
           let to = dict["to"] as? Int {
            return EditorSelection(from: from, to: to)
        }
        return EditorSelection(from: 0, to: 0)
    }
    
    /// Set selection range
    public func setSelection(from: Int, to: Int) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setSelection(\(from), \(to))")
    }
    
    // MARK: - Formatting Commands
    
    public func toggleBold() async {
        await executeCommand("toggleBold")
    }
    
    public func toggleItalic() async {
        await executeCommand("toggleItalic")
    }
    
    public func toggleCode() async {
        await executeCommand("toggleCode")
    }
    
    public func toggleStrikethrough() async {
        await executeCommand("toggleStrikethrough")
    }
    
    public func insertLink(url: String, title: String? = nil) async {
        guard let webView, isReady else { return }
        let titleArg = title.map { ", \"\($0)\"" } ?? ""
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertLink(\"\(url)\"\(titleArg))")
    }
    
    public func insertImage(url: String, alt: String? = nil) async {
        guard let webView, isReady else { return }
        let altArg = alt.map { ", \"\($0)\"" } ?? ""
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertImage(\"\(url)\"\(altArg))")
    }
    
    public func insertHeading(level: Int) async {
        guard let webView, isReady, (1...6).contains(level) else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertHeading(\(level))")
    }
    
    public func insertBlockquote() async {
        await executeCommand("insertBlockquote")
    }
    
    public func insertCodeBlock(language: String? = nil) async {
        guard let webView, isReady else { return }
        let langArg = language.map { "\"\($0)\"" } ?? ""
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertCodeBlock(\(langArg))")
    }
    
    public func insertList(ordered: Bool) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertList(\(ordered))")
    }
    
    public func insertHorizontalRule() async {
        await executeCommand("insertHorizontalRule")
    }
    
    // MARK: - Editor State
    
    public func focus() async {
        await executeCommand("focus")
    }
    
    public func blur() async {
        await executeCommand("blur")
    }
    
    public func undo() async {
        await executeCommand("undo")
    }
    
    public func redo() async {
        await executeCommand("redo")
    }
    
    // MARK: - Theme
    
    public func setTheme(_ theme: EditorTheme) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setTheme(\"\(theme.rawValue)\")")
    }
    
    // MARK: - Configuration
    
    public func setFontSize(_ size: CGFloat) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setFontSize(\(size))")
    }
    
    public func setLineHeight(_ height: CGFloat) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setLineHeight(\(height))")
    }
    
    public func setFontFamily(_ family: String) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setFontFamily(\"\(family)\")")
    }
    
    // MARK: - Private Helpers
    
    private func executeCommand(_ command: String) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.\(command)()")
    }
}

// MARK: - WKScriptMessageHandler

extension EditorBridge: WKScriptMessageHandler {
    
    nonisolated public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        // Capture properties before switching to MainActor
        Task { @MainActor in
            guard message.name == "editor",
                  let body = message.body as? [String: Any],
                  let typeString = body["type"] as? String,
                  let type = EditorMessageType(rawValue: typeString)
            else { return }
            
            handleMessage(type: type, payload: body["payload"])
        }
    }
    
    @MainActor
    private func handleMessage(type: EditorMessageType, payload: Any?) {
        switch type {
        case .contentChanged:
            guard !isUpdatingFromSwift,
                  let dict = payload as? [String: Any],
                  let content = dict["content"] as? String
            else { return }
            
            cachedContent = content
            delegate?.editorDidChangeContent(content)
            
        case .selectionChanged:
            if let dict = payload as? [String: Any],
               let from = dict["from"] as? Int,
               let to = dict["to"] as? Int {
                delegate?.editorDidChangeSelection(EditorSelection(from: from, to: to))
            }
            
        case .ready:
            isReady = true
            // If we have cached content, set it now
            if !cachedContent.isEmpty {
                Task {
                    await setContent(cachedContent)
                }
            }
            delegate?.editorDidBecomeReady()
            
        case .focus:
            delegate?.editorDidFocus()
            
        case .blur:
            delegate?.editorDidBlur()
        }
    }
}

// MARK: - Leak Avoider

/// Prevents retain cycle between WKWebView and message handler
private final class LeakAvoider: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?
    
    init(delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }
    
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}

// MARK: - Theme

public enum EditorTheme: String, Sendable {
    case light
    case dark
}
