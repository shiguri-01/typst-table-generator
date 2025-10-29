import { ESCAPE_CHARS, escapeSet } from "./utils/format";

/**
 * Format a list of Typst expressions as an array literal.
 *
 * - Each item is trimmed and minimally escaped with {@link ESCAPE_CHARS}.
 * - Output example: `(auto, left, 1pt)`.
 */
export const formatArray = (items: string[]): string =>
  `(${items.map((item) => escapeSet(item, ESCAPE_CHARS).trim()).join(", ")})`;
