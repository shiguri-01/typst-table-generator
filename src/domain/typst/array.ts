/**
 * Format a list of Typst expressions as an array literal.
 *
 * - Output example: `(auto, left, right)`.
 */
export const formatArray = (items: string[]): string =>
  `(${items.map((item) => item.trim()).join(", ")})`;
