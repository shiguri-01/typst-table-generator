import { type Cell, createEmptyCell } from "./cell";

export type Row = Cell[];

export const createEmptyRow = (numCols: number): Row =>
  Array.from({ length: numCols }, createEmptyCell);

export const normalizeRowLength = (row: Row, numCols: number): Row => {
  if (row.length === numCols) return row;
  if (row.length > numCols) return row.slice(0, numCols);
  return [
    ...row,
    ...Array.from({ length: numCols - row.length }, createEmptyCell),
  ];
};
