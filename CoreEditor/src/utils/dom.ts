/**
 * DOM manipulation utilities.
 */

/**
 * Creates an element with the given class name and optional attributes.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

/**
 * Safely removes an element from the DOM.
 */
export function removeElement(el: Element | null): void {
  el?.parentNode?.removeChild(el);
}

/**
 * Injects CSS styles into the document head.
 * Returns a cleanup function to remove the styles.
 */
export function injectStyles(css: string, id?: string): () => void {
  const style = document.createElement("style");
  if (id) style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  return () => removeElement(style);
}
