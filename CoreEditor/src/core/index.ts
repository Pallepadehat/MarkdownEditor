/**
 * Core module exports.
 */

export {
  initEditor,
  destroyEditor,
  getEditorView,
  getCommandPalette,
} from "./editor";
export { createEditorAPI } from "./api";
export {
  themeCompartment,
  styleCompartment,
  lineNumbersCompartment,
  lineWrappingCompartment,
  mermaidCompartment,
  syntaxHidingCompartment,
  imageCompartment,
  mathCompartment,
  getConfig,
  updateConfig,
  resetConfig,
  defaultConfig,
} from "./state";
