/**
 * Inline "Magic" Calculator for math blocks.
 *
 * Evaluates expressions ending with '=' inside math blocks.
 */

import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

type MathEvaluate = (expression: string) => unknown;

let mathEvaluatePromise: Promise<MathEvaluate> | null = null;

async function getMathEvaluate(): Promise<MathEvaluate> {
  if (!mathEvaluatePromise) {
    mathEvaluatePromise = import("mathjs").then((module) => module.evaluate);
  }
  return mathEvaluatePromise;
}

/**
 * Checks if cursor is inside a math block on the current line.
 */
function isInsideMath(text: string, pos: number): boolean {
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const lineEnd = text.indexOf("\n", pos);
  const lineText = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  const relPos = pos - lineStart;

  let inMath = false;
  let lastDollarIndex = -1;

  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === "$") {
      if (i > 0 && lineText[i - 1] === "\\") continue;

      if (inMath) {
        if (i >= relPos && lastDollarIndex < relPos) return true;
        inMath = false;
      } else {
        inMath = true;
        lastDollarIndex = i;
      }
    }
  }

  if (inMath && relPos > lastDollarIndex) return true;
  return false;
}

/**
 * Autocompletion source that evaluates math expressions.
 */
export function mathCompletion(
  context: CompletionContext
): CompletionResult | Promise<CompletionResult | null> | null {
  const { state, pos } = context;

  const charBefore = state.sliceDoc(pos - 1, pos);
  if (charBefore !== "=") return null;

  const line = state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  if (!isInsideMath(line.text, pos - line.from)) return null;

  const lastDollar = textBefore.lastIndexOf("$");
  const expressionStart = lastDollar !== -1 ? lastDollar + 1 : 0;
  const expression = textBefore
    .slice(expressionStart, textBefore.length - 1)
    .trim();

  if (!expression) return null;

  return getMathEvaluate()
    .then((evaluate) => {
      const result = evaluate(expression);
      if (result === undefined || result === null) return null;

      let displayResult = result.toString();
      if (typeof result === "number" && !Number.isInteger(result)) {
        displayResult = parseFloat(result.toFixed(4)).toString();
      }

      return {
        from: pos,
        options: [
          {
            label: displayResult,
            type: "constant",
            detail: ` = ${expression}`,
            apply: ` ${displayResult}`,
          },
        ],
      };
    })
    .catch(() => null);
}
