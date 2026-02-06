import XCTest
@testable import MarkdownEditor

/// Comprehensive tests for EditorBridge functionality.
final class EditorBridgeTests: XCTestCase {
    
    // MARK: - Initialization Tests
    
    @MainActor
    func testBridgeInitialState() {
        let bridge = EditorBridge()
        
        XCTAssertFalse(bridge.isReady, "Bridge should not be ready initially")
        XCTAssertNil(bridge.delegate, "Bridge should have no delegate initially")
    }
    
    // MARK: - EditorSelection Tests
    
    func testSelectionIsEmpty() {
        let emptySelection = EditorSelection(from: 10, to: 10)
        XCTAssertTrue(emptySelection.isEmpty, "Selection with same from/to should be empty")
        
        let nonEmptySelection = EditorSelection(from: 10, to: 20)
        XCTAssertFalse(nonEmptySelection.isEmpty, "Selection with different from/to should not be empty")
    }
    
    func testSelectionLength() {
        let selection1 = EditorSelection(from: 0, to: 0)
        XCTAssertEqual(selection1.length, 0)
        
        let selection2 = EditorSelection(from: 10, to: 25)
        XCTAssertEqual(selection2.length, 15)
        
        let selection3 = EditorSelection(from: 100, to: 500)
        XCTAssertEqual(selection3.length, 400)
    }
    
    func testSelectionEquality() {
        let sel1 = EditorSelection(from: 5, to: 10)
        let sel2 = EditorSelection(from: 5, to: 10)
        let sel3 = EditorSelection(from: 5, to: 11)
        
        XCTAssertEqual(sel1, sel2, "Identical selections should be equal")
        XCTAssertNotEqual(sel1, sel3, "Different selections should not be equal")
    }
    
    // MARK: - Error Handling Tests
    
    func testEditorBridgeErrorDescriptions() {
        let notReadyError = EditorBridgeError.editorNotReady
        XCTAssertNotNil(notReadyError.errorDescription)
        XCTAssertNotNil(notReadyError.recoverySuggestion)
        
        let jsError = EditorBridgeError.javaScriptEvaluationFailed(
            command: "setContent",
            underlyingError: nil
        )
        XCTAssertTrue(jsError.errorDescription?.contains("setContent") ?? false)
        
        let invalidError = EditorBridgeError.invalidInput(
            parameter: "level",
            reason: "Out of range"
        )
        XCTAssertTrue(invalidError.errorDescription?.contains("level") ?? false)
        XCTAssertTrue(invalidError.errorDescription?.contains("Out of range") ?? false)
        
        let disconnectedError = EditorBridgeError.bridgeDisconnected
        XCTAssertNotNil(disconnectedError.errorDescription)
        
        let encodingError = EditorBridgeError.encodingFailed(reason: "Invalid JSON")
        XCTAssertTrue(encodingError.errorDescription?.contains("Invalid JSON") ?? false)
    }
    
    // MARK: - EditorConfiguration Tests
    
    func testEditorConfigurationDefaults() {
        let config = EditorConfiguration.default
        
        XCTAssertEqual(config.fontSize, 15)
        XCTAssertEqual(config.lineHeight, 1.6)
        XCTAssertTrue(config.showLineNumbers)
        XCTAssertTrue(config.wrapLines)
        XCTAssertTrue(config.renderMermaid)
        XCTAssertTrue(config.renderMath)
        XCTAssertTrue(config.renderImages)
        XCTAssertTrue(config.hideSyntax)
    }
    
    func testEditorConfigurationCustomization() {
        let config = EditorConfiguration(
            fontSize: 18, 
            fontFamily: "Monaco",
            lineHeight: 1.8,
            showLineNumbers: false,
            wrapLines: false,
            renderMermaid: false,
            renderMath: false,
            renderImages: false,
            hideSyntax: false
        )
        
        XCTAssertEqual(config.fontSize, 18)
        XCTAssertEqual(config.fontFamily, "Monaco")
        XCTAssertEqual(config.lineHeight, 1.8)
        XCTAssertFalse(config.showLineNumbers)
        XCTAssertFalse(config.wrapLines)
        XCTAssertFalse(config.renderMermaid)
        XCTAssertFalse(config.renderMath)
        XCTAssertFalse(config.renderImages)
        XCTAssertFalse(config.hideSyntax)
    }
    
    func testEditorConfigurationEquality() {
        let config1 = EditorConfiguration(fontSize: 16)
        let config2 = EditorConfiguration(fontSize: 16)
        let config3 = EditorConfiguration(fontSize: 18)
        
        XCTAssertEqual(config1, config2, "Configurations with same values should be equal")
        XCTAssertNotEqual(config1, config3, "Configurations with different values should not be equal")
    }
    
    func testEditorConfigurationCodable() throws {
        let original = EditorConfiguration(
            fontSize: 20,
            fontFamily: "Courier",
            lineHeight: 2.0,
            showLineNumbers: false
        )
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(original)
        
        let decoder = JSONDecoder()
        let decoded = try decoder.decode(EditorConfiguration.self, from: data)
        
        XCTAssertEqual(decoded, original, "Configuration should be encodable and decodable")
    }
    
    // MARK: - EditorTheme Tests
    
    func testEditorThemeRawValues() {
        XCTAssertEqual(EditorTheme.light.rawValue, "light")
        XCTAssertEqual(EditorTheme.dark.rawValue, "dark")
    }
    
    // MARK: - EditorMessageType Tests
    
    func testEditorMessageTypeFromRawValue() {
        XCTAssertEqual(EditorMessageType(rawValue: "contentChanged"), .contentChanged)
        XCTAssertEqual(EditorMessageType(rawValue: "selectionChanged"), .selectionChanged)
        XCTAssertEqual(EditorMessageType(rawValue: "ready"), .ready)
        XCTAssertEqual(EditorMessageType(rawValue: "focus"), .focus)
        XCTAssertEqual(EditorMessageType(rawValue: "blur"), .blur)
        XCTAssertNil(EditorMessageType(rawValue: "unknown"))
        XCTAssertNil(EditorMessageType(rawValue: ""))
    }
    
    func testEditorMessageTypeRawValues() {
        XCTAssertEqual(EditorMessageType.contentChanged.rawValue, "contentChanged")
        XCTAssertEqual(EditorMessageType.selectionChanged.rawValue, "selectionChanged")
        XCTAssertEqual(EditorMessageType.ready.rawValue, "ready")
        XCTAssertEqual(EditorMessageType.focus.rawValue, "focus")
        XCTAssertEqual(EditorMessageType.blur.rawValue, "blur")
    }
    
    // MARK: - Edge Case Tests
    
    func testSelectionLargeNumbers() {
        let selection = EditorSelection(from: 1_000_000, to: 2_000_000)
        XCTAssertEqual(selection.length, 1_000_000)
        XCTAssertFalse(selection.isEmpty)
    }
    
    func testConfigurationExtremeValues() {
        let config = EditorConfiguration(
            fontSize: 1,
            fontFamily: "",
            lineHeight: 0.1
        )
        
        XCTAssertEqual(config.fontSize, 1)
        XCTAssertEqual(config.fontFamily, "")
        XCTAssertEqual(config.lineHeight, 0.1)
    }
    
    func testConfigurationWithSpecialCharactersInFontFamily() {
        let config = EditorConfiguration(
            fontFamily: #"-apple-system, "SF Mono", 'Courier New'"#
        )
        XCTAssertTrue(config.fontFamily.contains("SF Mono"))
    }
    
    // MARK: - Concurrent Operations Tests
    
    @MainActor
    func testMultipleSelectionCreation() async {
        // Test that creating multiple selections concurrently doesn't cause issues
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<100 {
                group.addTask {
                    let selection = EditorSelection(from: i * 10, to: i * 10 + 5)
                    XCTAssertEqual(selection.length, 5)
                }
            }
        }
    }
    
    @MainActor
    func testMultipleConfigurationCreation() async {
        // Test that creating multiple configurations concurrently doesn't cause issues
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<100 {
                group.addTask {
                    let config = EditorConfiguration(fontSize: CGFloat(10 + i))
                    XCTAssertEqual(config.fontSize, CGFloat(10 + i))
                }
            }
        }
    }
}
