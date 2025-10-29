import type { Align } from "../alignment";

/** Per-column defaults applied when cells don't specify alignment. */
export type ColumnSpec = {
  align?: Align;
};

/** Default empty column spec (equivalent to `align: auto`). */
export const DEFAULT_COLUMN_SPEC: ColumnSpec = {} as const;
