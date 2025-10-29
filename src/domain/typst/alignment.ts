/**
 * Alignment model and formatting helpers for Typst.
 *
 * This module defines horizontal/vertical alignment types and converts them
 * into Typst-friendly strings that can be used in function arguments
 * (e.g. `table(align: ...)` or `table.cell(align: ...)`).
 */

export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "horizon" | "bottom";

export type Align = {
  horizontal?: HorizontalAlign;
  vertical?: VerticalAlign;
};

/**
 * Default alignment: defer to Typst (`auto`).
 */
export const DEFAULT_ALIGN: Align = {} as const;
/**
 * Literal used when neither horizontal nor vertical alignment is provided.
 */
export const ALIGN_AUTO = "auto";

/**
 * Format an {@link Align} value for use in Typst code.
 *
 * - When both axes are present, returns `"<h> + <v>"`.
 * - When only one axis is present, returns that axis string.
 * - When no axis is present, returns {@link ALIGN_AUTO}.
 */
export const formatAlign = (align: Align): string => {
  if (align.horizontal && align.vertical) {
    return `${align.horizontal} + ${align.vertical}`;
  }
  return align.horizontal ?? align.vertical ?? ALIGN_AUTO;
};
