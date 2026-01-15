/**
 * Editor state management with compartments.
 */

import { Compartment } from "@codemirror/state";
import type { EditorConfig } from "../bridge";

/**
 * Compartments for dynamic reconfiguration.
 */
export const themeCompartment = new Compartment();
export const styleCompartment = new Compartment();
export const lineNumbersCompartment = new Compartment();
export const lineWrappingCompartment = new Compartment();
export const mermaidCompartment = new Compartment();
export const syntaxHidingCompartment = new Compartment();
export const imageCompartment = new Compartment();
export const mathCompartment = new Compartment();

/**
 * Default configuration values.
 */
export const defaultConfig: EditorConfig = {
  theme: "light",
  fontSize: 15,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Mono", Menlo, Monaco, monospace',
  lineHeight: 1.8,
  showLineNumbers: true,
  wrapLines: true,
  renderMermaid: true,
  hideSyntax: true,
  renderImages: true,
  renderMath: true,
};

/**
 * Current configuration state.
 */
let currentConfig: EditorConfig = { ...defaultConfig };

/**
 * Gets the current configuration.
 */
export function getConfig(): EditorConfig {
  return { ...currentConfig };
}

/**
 * Updates the current configuration.
 */
export function updateConfig(partial: Partial<EditorConfig>): EditorConfig {
  currentConfig = { ...currentConfig, ...partial };
  return currentConfig;
}

/**
 * Resets configuration to defaults.
 */
export function resetConfig(): EditorConfig {
  currentConfig = { ...defaultConfig };
  return currentConfig;
}
