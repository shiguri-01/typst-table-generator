import type { Align } from "../alignment";

export type ColumnSpec = {
  align?: Align;
};

export const DEFAULT_COLUMN_SPEC: ColumnSpec = {} as const;
