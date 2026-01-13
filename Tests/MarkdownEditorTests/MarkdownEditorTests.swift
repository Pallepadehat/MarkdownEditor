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
    
    // MARK: - EditorBridge Tests
    
    @MainActor
    func testEditorBridgeInitialState() {
        let bridge = EditorBridge()
        
        XCTAssertFalse(bridge.isReady, "Bridge should not be ready before configuration")
        XCTAssertNil(bridge.delegate, "Bridge should have no delegate initially")
    }
    
    // MARK: - Resource Bundle Tests
    
    func testEditorHTMLExists() {
        let htmlURL = Bundle.module.url(forResource: "editor", withExtension: "html")
        XCTAssertNotNil(htmlURL, "editor.html should exist in bundle")
    }
    
    func testEditorJSExists() {
        let jsURL = Bundle.module.url(forResource: "editor", withExtension: "js")
        XCTAssertNotNil(jsURL, "editor.js should exist in bundle")
    }
    
    func testEditorHTMLContainsEditorDiv() throws {
        let htmlURL = try XCTUnwrap(Bundle.module.url(forResource: "editor", withExtension: "html"))
        let htmlContent = try String(contentsOf: htmlURL, encoding: .utf8)
        
        XCTAssertTrue(htmlContent.contains("id=\"editor\""), "HTML should contain editor div")
        XCTAssertTrue(htmlContent.contains("editor.js"), "HTML should reference editor.js")
    }
}
