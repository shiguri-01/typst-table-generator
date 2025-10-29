import { type Cell, createEmptyCell } from "./cell";
import { type ColumnSpec, DEFAULT_COLUMN_SPEC } from "./column";
import { createEmptyRow, normalizeRowLength, type Row } from "./row";

export const DEFAULT_TABLE_HEADER_ROWS = 0;

export type Table = {
  columnSpecs: ColumnSpec[];
  rows: Row[];
  /**
   * Number of header rows at the top of the table.
   */
  headerRows?: number;
  /**
   * Where to draw strokes
   */
  strokes: {
    row: boolean[];
    column: boolean[];
  };
};

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

const resolveIndex = (length: number, atIndex?: number): number => {
  if (atIndex === undefined) return length; // 末尾
  if (atIndex < 0) return Math.max(0, length + 1 + atIndex); // -1 で末尾、-length-1 で 0
  return Math.max(0, Math.min(atIndex, length));
};

const resolveRowIndex = (table: Table, atIndex?: number) =>
  resolveIndex(table.rows.length, atIndex);

const resolveColumnIndex = (specs: ColumnSpec[], atIndex?: number) =>
  resolveIndex(specs.length, atIndex);

const bumpHeaderOnInsertRow = (
  headerRows: number | undefined,
  insertAt: number,
) => {
  if (headerRows === undefined) return undefined;
  return insertAt <= headerRows ? headerRows + 1 : headerRows;
};

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

const bumpHeaderOnRemoveRow = (
  headerRows: number | undefined,
  removeAt: number,
) => {
  if (headerRows === undefined) return undefined;
  return removeAt < headerRows ? Math.max(0, headerRows - 1) : headerRows;
};

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

export const isInBounds = (
  table: Table,
  pos: { row: number; column: number },
): boolean => {
  const { row, column } = pos;
  return (
    row >= 0 &&
    row < table.rows.length &&
    column >= 0 &&
    column < table.columnSpecs.length
  );
};

export const dimensions = (table: Table): { rows: number; columns: number } => {
  return {
    rows: table.rows.length,
    columns: table.columnSpecs.length,
  };
};

// TODO: CellやColumnSpecの編集関数
