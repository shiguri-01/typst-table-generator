import { type Cell, createEmptyCell } from "./cell";

/** A ordered collection of cells representing one table row. */
export type Row = Cell[];

/** Create an empty row with `numCols` fresh cells. */
export const createEmptyRow = (numCols: number): Row =>
  Array.from({ length: numCols }, createEmptyCell);

/**
 * Ensure a row has exactly `numCols` cells by truncating or padding.
 */
export const normalizeRowLength = (row: Row, numCols: number): Row => {
  if (row.length === numCols) return row;
  if (row.length > numCols) return row.slice(0, numCols);
  return [
    ...row,
    ...Array.from({ length: numCols - row.length }, createEmptyCell),
  ];
};
