import type { Align } from "../alignment";
import { type Cell, createEmptyCell } from "./cell";
import { type ColumnSpec, DEFAULT_COLUMN_SPEC } from "./column";
import { createEmptyRow, normalizeRowLength, type Row } from "./row";

/** Default header rows when unspecified. */
export const DEFAULT_TABLE_HEADER_ROWS = 0;

/**
 * Immutable table model used by the Typst domain.
 * - `columnSpecs`: per-column defaults (alignment).
 * - `rows`: matrix of cells.
 * - `headerRows`: number of header rows at the top (optional).
 * - `strokes`: boolean arrays for horizontal/vertical boundaries.
 */
export type Table = {
  readonly columnSpecs: ReadonlyArray<ColumnSpec>;
  readonly rows: ReadonlyArray<Row>;
  /**
   * Number of header rows at the top of the table.
   */
  readonly headerRows?: number;
  /**
   * Where to draw strokes
   */
  readonly strokes: {
    readonly row: ReadonlyArray<boolean>;
    readonly column: ReadonlyArray<boolean>;
  };
};

/** Create a new empty table with given row/column counts. */
export const createEmptyTable = (numRows: number, numCols: number): Table => {
  const columnSpecs: ColumnSpec[] = Array.from({ length: numCols }, () => ({
    ...DEFAULT_COLUMN_SPEC,
  }));

  const rows: Cell[][] = Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, createEmptyCell),
  );

  return {
    columnSpecs,
    rows,
    strokes: {
      row: Array(numRows + 1).fill(false),
      column: Array(numCols + 1).fill(false),
    },
  };
};

/** Clamp/normalize an insertion/removal index to a valid boundary. */
const resolveIndex = (length: number, atIndex?: number): number => {
  if (atIndex === undefined) return length; // 末尾
  if (atIndex < 0) return Math.max(0, length + 1 + atIndex); // -1 で末尾、-length-1 で 0
  return Math.max(0, Math.min(atIndex, length));
};

/** Resolve a row insertion/removal index for {@link Table}. */
const resolveRowIndex = (table: Table, atIndex?: number) =>
  resolveIndex(table.rows.length, atIndex);

/** Resolve a column insertion/removal index for {@link ColumnSpec} list. */
const resolveColumnIndex = (specs: readonly ColumnSpec[], atIndex?: number) =>
  resolveIndex(specs.length, atIndex);

/** Increment headerRows when inserting at or above the header region. */
const bumpHeaderOnInsertRow = (
  headerRows: number | undefined,
  insertAt: number,
) => {
  if (headerRows === undefined) return undefined;
  return insertAt <= headerRows ? headerRows + 1 : headerRows;
};

/** Insert a row at `atIndex` (end by default), preserving strokes and headers. */
export const insertRow = (
  table: Table,
  atIndex?: number,
  rowData?: Row,
): Table => {
  const insertAt = resolveRowIndex(table, atIndex);
  const numCols = table.columnSpecs.length;

  const newRow: Row = rowData
    ? normalizeRowLength(rowData, numCols)
    : createEmptyRow(numCols);
  const newRows = [
    ...table.rows.slice(0, insertAt),
    newRow,
    ...table.rows.slice(insertAt),
  ];

  const newRowStrokes = Array.from(
    { length: newRows.length + 1 },
    (_, newRowIndex) => {
      const originalRowIndex =
        newRowIndex < insertAt ? newRowIndex : newRowIndex - 1;
      return table.strokes.row[originalRowIndex] ?? false;
    },
  );

  return {
    ...table,
    headerRows: bumpHeaderOnInsertRow(table.headerRows, insertAt),
    rows: newRows,
    strokes: {
      ...table.strokes,
      row: newRowStrokes,
    },
  };
};

/** Decrement headerRows when removing from within the header region. */
const bumpHeaderOnRemoveRow = (
  headerRows: number | undefined,
  removeAt: number,
) => {
  if (headerRows === undefined) return undefined;
  return removeAt < headerRows ? Math.max(0, headerRows - 1) : headerRows;
};

/** Remove a row at `atIndex` if present, preserving strokes and headers. */
export const removeRow = (table: Table, atIndex: number): Table => {
  const removeAt = resolveRowIndex(table, atIndex);

  if (table.rows.length === 0 || removeAt >= table.rows.length) {
    return table;
  }

  const newRows = [
    ...table.rows.slice(0, removeAt),
    ...table.rows.slice(removeAt + 1),
  ];

  const newRowStrokes = Array.from(
    { length: newRows.length + 1 },
    (_, newRowIndex) => {
      const originalRowIndex =
        newRowIndex < removeAt ? newRowIndex : newRowIndex + 1;
      return table.strokes.row[originalRowIndex] ?? false;
    },
  );

  return {
    ...table,
    headerRows: bumpHeaderOnRemoveRow(table.headerRows, removeAt),
    rows: newRows,
    strokes: {
      ...table.strokes,
      row: newRowStrokes,
    },
  };
};

const createEmptyColumn = (numRows: number): Row =>
  Array.from({ length: numRows }, createEmptyCell);

const normalizeColumnLength = (column: Cell[], numRows: number): Cell[] => {
  if (column.length === numRows) return column;
  if (column.length > numRows) return column.slice(0, numRows);
  return [
    ...column,
    ...Array.from({ length: numRows - column.length }, createEmptyCell),
  ];
};

/** Insert a column at `atIndex` (end by default), preserving strokes. */
export const insertColumn = (
  table: Table,
  atIndex?: number,
  column?: {
    spec?: ColumnSpec;
    cells?: Cell[];
  },
): Table => {
  const insertAt = resolveColumnIndex(table.columnSpecs, atIndex);
  const numRows = table.rows.length;

  const newColumnSpec: ColumnSpec = {
    ...DEFAULT_COLUMN_SPEC,
    ...(column?.spec ?? {}),
  };
  const newColumnSpecs = [
    ...table.columnSpecs.slice(0, insertAt),
    newColumnSpec,
    ...table.columnSpecs.slice(insertAt),
  ];

  const newColumnCells: Cell[] = column?.cells
    ? normalizeColumnLength(column.cells, numRows)
    : createEmptyColumn(numRows);
  const newRows = table.rows.map((row, rowIndex) => [
    ...row.slice(0, insertAt),
    newColumnCells[rowIndex],
    ...row.slice(insertAt),
  ]);

  const newColumnStrokes = Array.from(
    { length: newColumnSpecs.length + 1 },
    (_, newColIndex) => {
      const originalColIndex =
        newColIndex < insertAt ? newColIndex : newColIndex - 1;
      return table.strokes.column[originalColIndex] ?? false;
    },
  );

  return {
    ...table,
    columnSpecs: newColumnSpecs,
    rows: newRows,
    strokes: {
      ...table.strokes,
      column: newColumnStrokes,
    },
  };
};

/** Remove a column at `atIndex` if present, preserving strokes. */
export const removeColumn = (table: Table, atIndex: number): Table => {
  const removeAt = resolveColumnIndex(table.columnSpecs, atIndex);

  if (table.columnSpecs.length === 0 || removeAt >= table.columnSpecs.length) {
    return table;
  }

  const newColumnSpecs = [
    ...table.columnSpecs.slice(0, removeAt),
    ...table.columnSpecs.slice(removeAt + 1),
  ];

  const newRows = table.rows.map((row) => [
    ...row.slice(0, removeAt),
    ...row.slice(removeAt + 1),
  ]);

  const newColumnStrokes = Array.from(
    { length: newColumnSpecs.length + 1 },
    (_, newColIndex) => {
      const originalColIndex =
        newColIndex < removeAt ? newColIndex : newColIndex + 1;
      return table.strokes.column[originalColIndex] ?? false;
    },
  );

  return {
    ...table,
    columnSpecs: newColumnSpecs,
    rows: newRows,
    strokes: {
      ...table.strokes,
      column: newColumnStrokes,
    },
  };
};

const isRowInBounds = (table: Table, row: number): boolean => {
  return row >= 0 && row < table.rows.length;
};

const isColumnInBounds = (table: Table, column: number): boolean => {
  return column >= 0 && column < table.columnSpecs.length;
};

/** Test whether a position is inside the table bounds. */
export const isInBounds = (
  table: Table,
  pos: { row: number; column: number },
): boolean => {
  const { row, column } = pos;
  return isRowInBounds(table, row) && isColumnInBounds(table, column);
};

/** Get current table dimensions (rows/columns). */
export const dimensions = (table: Table): { rows: number; columns: number } => {
  return {
    rows: table.rows.length,
    columns: table.columnSpecs.length,
  };
};

/**
 * Helper to update a single cell field.
 *
 * Accepts either a direct value or an updater function that receives the
 * previous value. Returns the same table if the position is out of bounds.
 */
const withCellField = <K extends keyof Cell>(
  table: Table,
  pos: { row: number; column: number },
  field: K,
  value: Cell[K] | ((prev: Cell[K]) => Cell[K]),
): Table => {
  if (!isInBounds(table, pos)) return table;

  const { row, column } = pos;

  const prevCell = table.rows[row][column];
  const newValue = typeof value === "function" ? value(prevCell[field]) : value;
  const newCell: Cell = {
    ...prevCell,
    [field]: newValue,
  };

  return {
    ...table,
    rows: table.rows.map((r, rowIndex) =>
      rowIndex === row
        ? r.map((c, colIndex) => (colIndex === column ? newCell : c))
        : r,
    ),
  };
};

/**
 * Update a cell's `content`.
 *
 * @param content - New string or updater `(prev) => next`.
 */
export const withCellContent = (
  table: Table,
  pos: { row: number; column: number },
  content: string | ((prev: string) => string),
) => withCellField(table, pos, "content", content);

/**
 * Update a cell's `align`.
 *
 * @param align - New {@link Align} or updater.
 */
export const withCellAlign = (
  table: Table,
  pos: { row: number; column: number },
  align: Align | ((prev: Align | undefined) => Align | undefined),
) => withCellField(table, pos, "align", align);

/** Update a cell's `bold` flag. */
export const withCellBold = (
  table: Table,
  pos: { row: number; column: number },
  bold: boolean | ((prev: boolean | undefined) => boolean | undefined),
) => withCellField(table, pos, "bold", bold);

/** Update a cell's `italic` flag. */
export const withCellItalic = (
  table: Table,
  pos: { row: number; column: number },
  italic: boolean | ((prev: boolean | undefined) => boolean | undefined),
) => withCellField(table, pos, "italic", italic);

/**
 * Update a column spec at index.
 *
 * Accepts either a full replacement spec or an updater function.
 */
const withColumnSpec = (
  table: Table,
  columnIndex: number,
  spec: ColumnSpec | ((prev: ColumnSpec) => ColumnSpec),
): Table => {
  if (!isColumnInBounds(table, columnIndex)) return table;

  const prevSpec = table.columnSpecs[columnIndex];
  const newSpec = typeof spec === "function" ? spec(prevSpec) : spec;

  return {
    ...table,
    columnSpecs: table.columnSpecs.map((s, colIndex) =>
      colIndex === columnIndex ? newSpec : s,
    ),
  };
};

/** Set per-column default alignment and clear cell-level overrides in that column. */
export const withColumnAlign = (
  table: Table,
  columnIndex: number,
  align: Align,
): Table => {
  const newTable = withColumnSpec(table, columnIndex, {
    ...table.columnSpecs[columnIndex],
    align,
  });

  // セルごとのalign設定をクリアする
  const newRows = newTable.rows.map((row) =>
    row.map((cell, colIndex) =>
      colIndex === columnIndex ? { ...cell, align: undefined } : cell,
    ),
  );

  return {
    ...newTable,
    rows: newRows,
  };
};

/** Test whether a row boundary index is valid (0..rows.length). */
const isRowBoundaryInBounds = (table: Table, y: number): boolean => {
  return y >= 0 && y <= table.rows.length;
};

/** Test whether a column boundary index is valid (0..columns). */
const isColumnBoundaryInBounds = (table: Table, x: number): boolean => {
  return x >= 0 && x <= table.columnSpecs.length;
};

/**
 * Update a horizontal stroke boundary.
 *
 * @param y - Row boundary index (0..rows.length)
 * @param value - Boolean or updater function `(prev) => next`.
 */
export const withRowStroke = (
  table: Table,
  y: number,
  value: boolean | ((prev: boolean) => boolean),
): Table => {
  if (!isRowBoundaryInBounds(table, y)) return table;
  const prev = table.strokes.row[y];
  const next =
    typeof value === "function"
      ? (value as (p: boolean) => boolean)(prev)
      : value;
  if (next === prev) return table;
  return {
    ...table,
    strokes: {
      ...table.strokes,
      row: table.strokes.row.map((v, i) => (i === y ? next : v)),
    },
  };
};

/**
 * Update a vertical stroke boundary.
 *
 * @param x - Column boundary index (0..columns)
 * @param value - Boolean or updater function `(prev) => next`.
 */
export const withColumnStroke = (
  table: Table,
  x: number,
  value: boolean | ((prev: boolean) => boolean),
): Table => {
  if (!isColumnBoundaryInBounds(table, x)) return table;
  const prev = table.strokes.column[x];
  const next =
    typeof value === "function"
      ? (value as (p: boolean) => boolean)(prev)
      : value;
  if (next === prev) return table;
  return {
    ...table,
    strokes: {
      ...table.strokes,
      column: table.strokes.column.map((v, i) => (i === x ? next : v)),
    },
  };
};
