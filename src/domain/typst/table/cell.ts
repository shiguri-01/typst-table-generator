import type { Align } from "../alignment";

export type Cell = {
  content: string;
  align?: Align;
  bold?: boolean;
  italic?: boolean;
};

export const EMPTY_CELL: Cell = {
  content: "",
} as const;

export const createEmptyCell = (): Cell => ({ ...EMPTY_CELL });
