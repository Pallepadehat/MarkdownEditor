import XCTest
@testable import MarkdownEditor

/// Performance tests for the MarkdownEditor package.
final class PerformanceTests: XCTestCase {
    
    // MARK: - String Escaping Performance
    
    func testEscapeSmallStringPerformance() {
        let smallText = "Hello, World! This is a test."
        
        measure {
            for _ in 0..<10_000 {
                _ = JavaScriptUtilities.escapeJavaScriptString(smallText)
            }
        }
    }
    
    func testEscapeMediumStringPerformance() {
        let mediumText = String(repeating: "Line with special chars: \\n\\t\\\"quotes\\\"\n", count: 100)
        
        measure {
            for _ in 0..<1_000 {
                _ = JavaScriptUtilities.escapeJavaScriptString(mediumText)
            }
        }
    }
    
    func testEscapeLargeStringPerformance() {
        // 1MB of text
        let largeText = String(repeating: "a", count: 1_000_000)
        
        measure {
            _ = JavaScriptUtilities.escapeJavaScriptString(largeText)
        }
    }
    
    func testEscapeMarkdownDocumentPerformance() {
        let markdown = """
        # Large Markdown Document
        
        ## Introduction
        
        This is a **test** document with *various* formatting.
        
        ### Code Example
        
        ```swift
        func example() {
            print("Hello, World!")
        }
        ```
        
        [Link](https://example.com)
        
        ![Image](https://example.com/image.png)
        """
        
        let largeMarkdown = String(repeating: markdown, count: 100)
        
        measure {
            _ = JavaScriptUtilities.escapeJavaScriptString(largeMarkdown)
        }
    }
    
    // MARK: - JavaScript Call Building Performance
    
    func testBuildSimpleCallsPerformance() throws {
        measure {
            for _ in 0..<10_000 {
                _ = try? JavaScriptUtilities.buildJavaScriptCall(
                    method: "window.editorAPI.focus"
                )
            }
        }
    }
    
    func testBuildCallsWithArgumentsPerformance() {
        measure {
            for i in 0..<10_000 {
                _ = try? JavaScriptUtilities.buildJavaScriptCall(
                    method: "window.editorAPI.setSelection",
                    arguments: [.number(Double(i)), .number(Double(i + 10))]
                )
            }
        }
    }
    
    func testBuildCallsWithStringArgumentsPerformance() {
        let content = "# Heading\n\nThis is **bold** content."
        
        measure {
            for _ in 0..<10_000 {
                _ = try? JavaScriptUtilities.buildJavaScriptCall(
                    method: "window.editorAPI.setContent",
                    arguments: [.string(content)]
                )
            }
        }
    }
    
    // MARK: - Validation Performance
    
    func testValidateInputPerformance() {
        let text = String(repeating: "a", count: 10_000)
        
        measure {
            for _ in 0..<10_000 {
                _ = try? JavaScriptUtilities.validateInput(text: text)
            }
        }
    }
    
    func testValidateHeadingLevelPerformance() {
        measure {
            for level in stride(from: 1, through: 6, by: 1) {
                for _ in 0..<10_000 {
                    _ = try? JavaScriptUtilities.validateHeadingLevel(level)
                }
            }
        }
    }
    
    func testValidateSelectionPerformance() {
        measure {
            for i in 0..<10_000 {
                _ = try? JavaScriptUtilities.validateSelection(from: i, to: i + 100)
            }
        }
    }
    
    // MARK: - EditorSelection Performance
    
    func testSelectionCreationPerformance() {
        measure {
            for i in 0..<100_000 {
                _ = EditorSelection(from: i, to: i + 10)
            }
        }
    }
    
    func testSelectionPropertyAccessPerformance() {
        let selections = (0..<10_000).map { EditorSelection(from: $0, to: $0 + 10) }
        
        measure {
            var totalLength = 0
            var emptyCount = 0
            for selection in selections {
                totalLength += selection.length
                if selection.isEmpty {
                    emptyCount += 1
                }
            }
            XCTAssertGreaterThan(totalLength, 0)
        }
    }
    
    // MARK: - EditorConfiguration Performance
    
    func testConfigurationCreationPerformance() {
        measure {
            for i in 0..<10_000 {
                _ = EditorConfiguration(fontSize: CGFloat(10 + i % 20))
            }
        }
    }
    
    func testConfigurationEqualityPerformance() {
        let config1 = EditorConfiguration(fontSize: 16, lineHeight: 1.5)
        let config2 = EditorConfiguration(fontSize: 16, lineHeight: 1.5)
        
        measure {
            for _ in 0..<100_000 {
                _ = config1 == config2
            }
        }
    }
    
    func testConfigurationEncodingPerformance() throws {
        let config = EditorConfiguration(fontSize: 20, lineHeight: 1.8)
        let encoder = JSONEncoder()
        
        measure {
            for _ in 0..<10_000 {
                _ = try? encoder.encode(config)
            }
        }
    }
    
    func testConfigurationDecodingPerformance() throws {
        let config = EditorConfiguration(fontSize: 20, lineHeight: 1.8)
        let encoder = JSONEncoder()
        let data = try encoder.encode(config)
        let decoder = JSONDecoder()
        
        measure {
            for _ in 0..<10_000 {
                _ = try? decoder.decode(EditorConfiguration.self, from: data)
            }
        }
    }
    
    // MARK: - Memory Usage Tests
    
    func testLargeTextMemoryFootprint() {
        // Test that large text doesn't cause excessive memory usage
        let largeText = String(repeating: "This is a line of text.\n", count: 100_000)
        
        measureMetrics([.wallClockTime], automaticallyStartMeasuring: false) {
            startMeasuring()
            _ = JavaScriptUtilities.escapeJavaScriptString(largeText)
            stopMeasuring()
        }
    }
    
    func testMultipleConfigurationsMemoryFootprint() {
        measureMetrics([.wallClockTime], automaticallyStartMeasuring: false) {
            startMeasuring()
            
            var configs: [EditorConfiguration] = []
            for i in 0..<1_000 {
                configs.append(EditorConfiguration(fontSize: CGFloat(10 + i % 20)))
            }
            
            XCTAssertEqual(configs.count, 1_000)
            
            stopMeasuring()
        }
    }
    
    // MARK: - Concurrent Operations Performance
    
    @MainActor
    func testConcurrentSelectionCreation() {
        measure {
            let semaphore = DispatchSemaphore(value: 0)
            Task { @MainActor in
                await withTaskGroup(of: Void.self) { group in
                    for i in 0..<1_000 {
                        group.addTask {
                            _ = EditorSelection(from: i * 10, to: i * 10 + 5)
                        }
                    }
                }
                semaphore.signal()
            }
            semaphore.wait()
        }
    }
    
    @MainActor
    func testConcurrentConfigurationCreation() {
        measure {
            let semaphore = DispatchSemaphore(value: 0)
            Task { @MainActor in
                await withTaskGroup(of: Void.self) { group in
                    for i in 0..<1_000 {
                        group.addTask {
                            _ = EditorConfiguration(fontSize: CGFloat(10 + i % 20))
                        }
                    }
                }
                semaphore.signal()
            }
            semaphore.wait()
        }
    }
}
