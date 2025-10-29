import type { Align } from "../alignment";

/**
 * A single table cell value in the Typst domain model.
 *
 * - `content` is a code of Typst content.
 * - `align` overrides column/table alignment for this cell only.
 * - `bold`/`italic` apply Typst inline formatting markers.
 */
export type Cell = {
  content: string;
  align?: Align;
  bold?: boolean;
  italic?: boolean;
};

/** An immutable empty cell used as a construction template. */
export const EMPTY_CELL: Cell = {
  content: "",
} as const;

/** Create a fresh empty {@link Cell}. */
export const createEmptyCell = (): Cell => ({ ...EMPTY_CELL });
