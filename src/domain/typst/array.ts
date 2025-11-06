/**
 * Format a list of Typst expressions as an array literal.
 *
 * - Output example: `(auto, left, right)`.
 */
export const formatArray = (items: string[]): string => {
  if (items.length === 0) {
    return "()";
  } else if (items.length === 1) {
    return `(${items[0].trim()},)`;
  } else {
    return `(${items.map((item) => item.trim()).join(", ")})`;
  }
};
