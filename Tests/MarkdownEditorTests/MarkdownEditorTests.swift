import XCTest
@testable import MarkdownEditor

/// Unit tests for the MarkdownEditor package
final class MarkdownEditorTests: XCTestCase {
    
    // MARK: - EditorConfiguration Tests
    
    func testDefaultConfiguration() {
        let config = EditorConfiguration.default
        
        XCTAssertEqual(config.fontSize, 15, "Default font size should be 15")
        XCTAssertEqual(config.lineHeight, 1.6, "Default line height should be 1.6")
        XCTAssertTrue(config.showLineNumbers, "Line numbers should be shown by default")
    }
    
    func testCustomConfiguration() {
        let config = EditorConfiguration(
            fontSize: 18,
            fontFamily: "Menlo",
            lineHeight: 1.8,
            showLineNumbers: false
        )
        
        XCTAssertEqual(config.fontSize, 18)
        XCTAssertEqual(config.fontFamily, "Menlo")
        XCTAssertEqual(config.lineHeight, 1.8)
        XCTAssertFalse(config.showLineNumbers)
    }
    
    func testFontFamilyWithQuotes() {
        let config = EditorConfiguration(
            fontFamily: "-apple-system, 'SF Mono', Menlo, monospace"
        )
        XCTAssertEqual(config.fontFamily, "-apple-system, 'SF Mono', Menlo, monospace",
                      "Font family with quotes should be preserved")
    }
    
    func testConfigurationWithAllFeatures() {
        let config = EditorConfiguration(
            fontSize: 16,
            fontFamily: "Monaco",
            lineHeight: 1.7,
            showLineNumbers: true,
            wrapLines: true,
            renderMermaid: true,
            renderMath: true,
            renderImages: true,
            hideSyntax: true
        )
        
        XCTAssertEqual(config.fontSize, 16)
        XCTAssertTrue(config.wrapLines)
        XCTAssertTrue(config.renderMermaid)
        XCTAssertTrue(config.renderMath)
        XCTAssertTrue(config.renderImages)
        XCTAssertTrue(config.hideSyntax)
    }
    
    func testConfigurationDisablingFeatures() {
        let config = EditorConfiguration(
            renderMermaid: false,
            renderMath: false,
            renderImages: false,
            hideSyntax: false
        )
        
        XCTAssertFalse(config.renderMermaid)
        XCTAssertFalse(config.renderMath)
        XCTAssertFalse(config.renderImages)
        XCTAssertFalse(config.hideSyntax)
    }
    
    // MARK: - EditorSelection Tests
    
    func testEditorSelectionEmpty() {
        let selection = EditorSelection(from: 5, to: 5)
        
        XCTAssertTrue(selection.isEmpty, "Selection with same from/to should be empty")
        XCTAssertEqual(selection.length, 0, "Empty selection should have length 0")
    }
    
    func testEditorSelectionWithRange() {
        let selection = EditorSelection(from: 10, to: 20)
        
        XCTAssertFalse(selection.isEmpty, "Selection with different from/to should not be empty")
        XCTAssertEqual(selection.length, 10, "Selection length should be to - from")
    }
    
    func testEditorSelectionAtStart() {
        let selection = EditorSelection(from: 0, to: 5)
        XCTAssertEqual(selection.from, 0)
        XCTAssertEqual(selection.to, 5)
        XCTAssertEqual(selection.length, 5)
    }
    
    func testEditorSelectionLargeRange() {
        let selection = EditorSelection(from: 1000, to: 5000)
        XCTAssertEqual(selection.length, 4000)
        XCTAssertFalse(selection.isEmpty)
    }
    
    // MARK: - EditorTheme Tests
    
    func testEditorThemeRawValues() {
        XCTAssertEqual(EditorTheme.light.rawValue, "light")
        XCTAssertEqual(EditorTheme.dark.rawValue, "dark")
    }
    
    // MARK: - EditorMessageType Tests
    
    func testEditorMessageTypeDecoding() {
        XCTAssertEqual(EditorMessageType(rawValue: "contentChanged"), .contentChanged)
        XCTAssertEqual(EditorMessageType(rawValue: "selectionChanged"), .selectionChanged)
        XCTAssertEqual(EditorMessageType(rawValue: "ready"), .ready)
        XCTAssertEqual(EditorMessageType(rawValue: "focus"), .focus)
        XCTAssertEqual(EditorMessageType(rawValue: "blur"), .blur)
        XCTAssertNil(EditorMessageType(rawValue: "invalid"))
    }
    
    func testEditorMessageTypeAllCases() {
        let allTypes: [EditorMessageType] = [
            .contentChanged,
            .selectionChanged,
            .ready,
            .focus,
            .blur
        ]
        
        for type in allTypes {
            XCTAssertNotNil(EditorMessageType(rawValue: type.rawValue),
                          "Type \(type) should round-trip through raw value")
        }
    }
    
    // MARK: - EditorBridge Tests
    
    @MainActor
    func testEditorBridgeInitialState() {
        let bridge = EditorBridge()
        
        XCTAssertFalse(bridge.isReady, "Bridge should not be ready before configuration")
        XCTAssertNil(bridge.delegate, "Bridge should have no delegate initially")
    }
    
    @MainActor
    func testEditorBridgeDelegateAssignment() {
        let bridge = EditorBridge()
        let delegate = MockDelegate()
        
        bridge.delegate = delegate
        XCTAssertNotNil(bridge.delegate, "Delegate should be assignable")
    }
    
    // MARK: - Resource Bundle Tests
    
    func testEditorHTMLExists() {
        let htmlURL = Bundle.module.url(forResource: "editor", withExtension: "html")
        XCTAssertNotNil(htmlURL, "editor.html should exist in bundle")
    }
    
    func testEditorHTMLContainsEditorDiv() throws {
        let htmlURL = try XCTUnwrap(Bundle.module.url(forResource: "editor", withExtension: "html"))
        let htmlContent = try String(contentsOf: htmlURL, encoding: .utf8)
        
        XCTAssertTrue(htmlContent.contains("id=\"editor\""), "HTML should contain editor div")
    }
    
    func testEditorHTMLHasValidStructure() throws {
        let htmlURL = try XCTUnwrap(Bundle.module.url(forResource: "editor", withExtension: "html"))
        let htmlContent = try String(contentsOf: htmlURL, encoding: .utf8)
        
        XCTAssertTrue(htmlContent.contains("<!DOCTYPE html>"), "HTML should have DOCTYPE")
        XCTAssertTrue(htmlContent.contains("<html"), "HTML should have html tag")
        XCTAssertTrue(htmlContent.contains("<head>"), "HTML should have head tag")
        XCTAssertTrue(htmlContent.contains("<body>"), "HTML should have body tag")
    }
    
    // MARK: - Sendable Conformance Tests
    
    func testEditorSelectionIsSendable() async {
        let selection = EditorSelection(from: 0, to: 10)
        
        await Task {
            let copiedSelection = selection
            XCTAssertEqual(copiedSelection.from, 0)
            XCTAssertEqual(copiedSelection.to, 10)
        }.value
    }
    
    func testEditorConfigurationIsSendable() async {
        let config = EditorConfiguration(fontSize: 16)
        
        await Task {
            let copiedConfig = config
            XCTAssertEqual(copiedConfig.fontSize, 16)
        }.value
    }
    
    func testEditorThemeIsSendable() async {
        let theme = EditorTheme.dark
        
        await Task {
            let copiedTheme = theme
            XCTAssertEqual(copiedTheme, .dark)
        }.value
    }
    
    func testEditorMessageTypeIsSendable() async {
        let messageType = EditorMessageType.contentChanged
        
        await Task {
            let copiedType = messageType
            XCTAssertEqual(copiedType, .contentChanged)
        }.value
    }
}

// MARK: - Mock Delegate

@MainActor
private class MockDelegate: EditorBridgeDelegate {
    var contentChangeCount = 0
    var selectionChangeCount = 0
    var readyCount = 0
    var focusCount = 0
    var blurCount = 0
    
    var lastContent: String?
    var lastSelection: EditorSelection?
    
    func editorDidChangeContent(_ content: String) {
        contentChangeCount += 1
        lastContent = content
    }
    
    func editorDidChangeSelection(_ selection: EditorSelection) {
        selectionChangeCount += 1
        lastSelection = selection
    }
    
    func editorDidBecomeReady() {
        readyCount += 1
    }
    
    func editorDidFocus() {
        focusCount += 1
    }
    
    func editorDidBlur() {
        blurCount += 1
    }
}
