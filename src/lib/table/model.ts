/**
 * Table model primitives and pure helpers aligned with `_docs/spec.md`.
 *
 * The helpers in this module never mutate their inputs – every operation
 * returns a fresh `TableModel` that already satisfies the normalization rules
 * defined in the spec (rectangular rows, clamped header count, synchronized
 * column specs / strokes, etc.).
 */

/**
 * Horizontal alignment values supported by the editor and Typst output.
 */
export type Align = "left" | "center" | "right";

/**
 * Inline content for a single table cell. `text` is stored verbatim; emphasis
 * flags and per-cell alignment are optional overrides.
 */
export interface Cell {
  text: string;
  align?: Align;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Lightweight input shape for constructing cells. All fields are optional and
 * default to the neutral values described in the spec.
 */
export type CellInit = Readonly<Partial<Cell>>;

/**
 * Column-wise hints for Typst table generation. Missing values fall back to
 * Typst defaults (`auto` width, `left` alignment).
 */
export interface ColumnSpec {
  width?: "auto" | number;
  align?: Align;
}

type StrokeEntry = RowStroke | ColumnStroke;

/**
 * Stroke intensity along a boundary. `"none"` disables the line; positive
 * numbers are interpreted as pt units when exporting to Typst.
 */
export type StrokeValue = "none" | number;

/**
 * Horizontal stroke settings – one object per logical row.
 */
export interface RowStroke {
  top?: StrokeValue;
  bottom?: StrokeValue;
}

/**
 * Vertical stroke settings – one object per logical column.
 */
export interface ColumnStroke {
  left?: StrokeValue;
  right?: StrokeValue;
}

/**
 * Aggregate stroke configuration for a table.
 */
export interface TableStrokes {
  rows?: RowStroke[];
  columns?: ColumnStroke[];
}

/**
 * Persisted representation of a table. The editor keeps this structure in a
 * normalized state so that it can be imported / exported without additional
 * shape checks.
 */
export interface TableModel {
  rows: Cell[][];
  headerRows?: number;
  caption?: string;
  columnSpecs?: ColumnSpec[];
  strokes?: TableStrokes;
}

/**
 * Immutable row input used for initialization or insertion helpers.
 */
export type RowInit = ReadonlyArray<CellInit>;

/**
 * Immutable column input used when inserting a column.
 */
export type ColumnInit = ReadonlyArray<CellInit>;

interface TableModelLike {
  rows: ReadonlyArray<ReadonlyArray<Cell>>;
  headerRows?: number;
  caption?: string;
  columnSpecs?: ReadonlyArray<ColumnSpec | undefined>;
  strokes?: TableStrokes;
}

/**
 * Coordinates pointing at a single cell within a table.
 */
export interface TableCellPosition {
  rowIndex: number;
  columnIndex: number;
}

/**
 * Input shape for constructing / normalizing a table model. Cell entries are
 * permissive so that callers can omit optional properties.
 */
export interface TableModelInit {
  rows: ReadonlyArray<RowInit>;
  headerRows?: number;
  caption?: string | null;
  columnSpecs?: ReadonlyArray<ColumnSpec | undefined>;
  strokes?: TableStrokes;
}

/**
 * Options for creating an empty table with predefined dimensions.
 */
export interface CreateEmptyTableOptions {
  headerRows?: number;
  caption?: string | null;
  columnSpecs?: ReadonlyArray<ColumnSpec | undefined>;
  strokes?: TableStrokes;
}

/**
 * Change handler accepted by `updateCell`.
 */
export type CellUpdater = (current: Cell) => Cell;

/**
 * Create a new table filled with blank cells. Throws if either dimension is
 * less than 1.
 */
export function createEmptyTable(
  rowCount: number,
  columnCount: number,
  options: CreateEmptyTableOptions = {},
): TableModel {
  if (!Number.isInteger(rowCount) || rowCount <= 0) {
    throw new RangeError("rowCount must be a positive integer");
  }
  if (!Number.isInteger(columnCount) || columnCount <= 0) {
    throw new RangeError("columnCount must be a positive integer");
  }

  const rows = Array.from({ length: rowCount }, () =>
    Array.from({ length: columnCount }, createEmptyCell),
  );

  return createTableModel({
    rows,
    headerRows: options.headerRows,
    caption: options.caption ?? undefined,
    columnSpecs: options.columnSpecs,
    strokes: options.strokes,
  });
}

/**
 * Normalize arbitrary row data into a `TableModel`. Suitable for loading JSON
 * from storage or TSV conversion pipelines.
 */
export function createTableModel(init: TableModelInit): TableModel {
  const normalizedRows = init.rows.map((row) => Array.from(row, normalizeCell));

  return normalizeTableModel({
    rows: normalizedRows,
    headerRows: init.headerRows,
    caption: init.caption ?? undefined,
    columnSpecs: init.columnSpecs?.map((spec) =>
      spec ? { ...spec } : undefined,
    ),
    strokes: init.strokes ? cloneStrokes(init.strokes) : undefined,
  });
}

/**
 * Return the current number of rows and columns for the given table.
 */
export function getTableDimensions(model: TableModel): {
  rowCount: number;
  columnCount: number;
} {
  return {
    rowCount: model.rows.length,
    columnCount: getColumnCount(model.rows),
  };
}

/**
 * Update a single cell. Accepts either a partial object patch or a callback
 * that receives the previous value. Returns a new model instance.
 */
export function updateCell(
  model: TableModel,
  position: TableCellPosition,
  updater: CellUpdater,
): TableModel {
  const { rowIndex, columnIndex } = position;
  const { rowCount, columnCount } = getTableDimensions(model);
  assertInBounds(rowIndex, rowCount, "rowIndex");
  assertInBounds(columnIndex, columnCount, "columnIndex");

  const rows = model.rows.slice();
  const currentRow = model.rows[rowIndex].map(cloneCell);
  const currentCell = currentRow[columnIndex];

  const nextCell = normalizeCell(updater(cloneCell(currentCell)));

  currentRow[columnIndex] = nextCell;
  rows[rowIndex] = currentRow;

  return normalizeTableModel({
    ...model,
    rows,
  });
}

/**
 * Convenience helper for applying a shallow patch to a cell.
 */
export function patchCell(
  model: TableModel,
  position: TableCellPosition,
  patch: Partial<Cell>,
): TableModel {
  return updateCell(model, position, (cell) => ({
    ...cell,
    ...patch,
  }));
}

/**
 * Insert a blank (or provided) row at `rowIndex`. The new row inherits the
 * current column count; shorter rows are padded, longer rows are truncated.
 */
export function insertRow(
  model: TableModel,
  rowIndex: number,
  row?: RowInit,
): TableModel {
  const { rowCount, columnCount } = getTableDimensions(model);
  assertInsertIndex(rowIndex, rowCount, "rowIndex");

  const rows = model.rows.slice();
  const normalizedRow = normalizeRow(row ?? [], columnCount);
  rows.splice(rowIndex, 0, normalizedRow);

  return normalizeTableModel({
    ...model,
    rows,
  });
}

/**
 * Remove the row at the specified index. Throws if the table would become
 * empty because the UI guards against zero-row tables per the spec.
 */
export function removeRow(model: TableModel, rowIndex: number): TableModel {
  const { rowCount } = getTableDimensions(model);
  assertInBounds(rowIndex, rowCount, "rowIndex");
  if (rowCount <= 1) {
    throw new RangeError("Table must contain at least one row");
  }

  const rows = model.rows.slice();
  rows.splice(rowIndex, 1);

  return normalizeTableModel({
    ...model,
    rows,
  });
}

/**
 * Insert a column at `columnIndex`. Existing rows receive a new blank cell at
 * that position (or the provided values if supplied).
 */
export function insertColumn(
  model: TableModel,
  columnIndex: number,
  column?: ColumnInit,
): TableModel {
  const { columnCount } = getTableDimensions(model);
  assertInsertIndex(columnIndex, columnCount, "columnIndex");

  const rows = model.rows.map((row, rowIdx) => {
    const nextRow = row.map(cloneCell);
    const value = column?.[rowIdx];
    nextRow.splice(
      columnIndex,
      0,
      value ? normalizeCell(value) : createEmptyCell(),
    );
    return nextRow;
  });

  return normalizeTableModel({
    ...model,
    rows,
  });
}

/**
 * Remove a column and shrink all dependent arrays. Throws if the table would
 * end up with zero columns.
 */
export function removeColumn(
  model: TableModel,
  columnIndex: number,
): TableModel {
  const { columnCount } = getTableDimensions(model);
  assertInBounds(columnIndex, columnCount, "columnIndex");
  if (columnCount <= 1) {
    throw new RangeError("Table must contain at least one column");
  }

  const rows = model.rows.map((row) => {
    const nextRow = row.map(cloneCell);
    nextRow.splice(columnIndex, 1);
    return nextRow;
  });

  return normalizeTableModel({
    ...model,
    rows,
  });
}

/**
 * Change the number of header rows. Values are clamped between 0 and the
 * current row count.
 */
export function setHeaderRows(
  model: TableModel,
  headerRows: number,
): TableModel {
  return normalizeTableModel({
    ...model,
    headerRows,
  });
}

/**
 * Update (or clear) the table caption.
 */
export function setCaption(
  model: TableModel,
  caption: string | null,
): TableModel {
  return normalizeTableModel({
    ...model,
    caption: caption ?? undefined,
  });
}

/**
 * Override a single column spec. Pass `undefined` to clear all hints for the
 * column.
 */
export function updateColumnSpec(
  model: TableModel,
  columnIndex: number,
  spec: ColumnSpec | undefined,
): TableModel {
  const { columnCount } = getTableDimensions(model);
  assertInBounds(columnIndex, columnCount, "columnIndex");

  const columnSpecs: ColumnSpec[] = Array.from(
    { length: columnCount },
    (_, idx) => {
      const current = model.columnSpecs?.[idx];
      return current ? { ...current } : ({} as ColumnSpec);
    },
  );
  columnSpecs[columnIndex] = spec ? { ...spec } : ({} as ColumnSpec);

  return normalizeTableModel({
    ...model,
    columnSpecs,
  });
}

/**
 * Update a horizontal stroke entry. Pass `undefined` or an empty patch to clear
 * the stroke settings for the row boundary.
 */
export function updateRowStroke(
  model: TableModel,
  rowIndex: number,
  stroke: RowStroke | undefined,
): TableModel {
  const { rowCount } = getTableDimensions(model);
  assertInBounds(rowIndex, rowCount, "rowIndex");

  const rows = ensureStrokeArray(
    model.strokes?.rows,
    rowCount,
    createRowStroke,
  );
  rows[rowIndex] = stroke ? normalizeRowStroke(stroke) : createRowStroke();

  return normalizeTableModel({
    ...model,
    strokes: {
      rows,
      columns: model.strokes?.columns
        ? model.strokes.columns.map((entry) => ({ ...entry }))
        : undefined,
    },
  });
}

/**
 * Update a vertical stroke entry. Pass `undefined` or an empty patch to clear
 * the stroke settings for the column boundary.
 */
export function updateColumnStroke(
  model: TableModel,
  columnIndex: number,
  stroke: ColumnStroke | undefined,
): TableModel {
  const { columnCount } = getTableDimensions(model);
  assertInBounds(columnIndex, columnCount, "columnIndex");

  const columns = ensureStrokeArray(
    model.strokes?.columns,
    columnCount,
    createColumnStroke,
  );
  columns[columnIndex] = stroke
    ? normalizeColumnStroke(stroke)
    : createColumnStroke();

  return normalizeTableModel({
    ...model,
    strokes: {
      rows: model.strokes?.rows
        ? model.strokes.rows.map((entry) => ({ ...entry }))
        : undefined,
      columns,
    },
  });
}

/**
 * Replace the entire stroke configuration with new values.
 */
export function setStrokes(
  model: TableModel,
  strokes: TableStrokes | undefined,
): TableModel {
  return normalizeTableModel({
    ...model,
    strokes: strokes ? cloneStrokes(strokes) : undefined,
  });
}

/**
 * Ensure the underlying arrays obey the invariants described in the spec.
 * Primarily useful when ingesting user-provided data.
 */
export function normalizeTableModel(model: TableModelLike): TableModel {
  if (model.rows.length === 0) {
    throw new RangeError("Table must contain at least one row");
  }

  const columnCount = getColumnCount(model.rows);
  if (columnCount === 0) {
    throw new RangeError("Table must contain at least one column");
  }

  const rows = model.rows.map((row) => normalizeRow(row, columnCount));
  const headerRows = clamp(model.headerRows ?? 0, 0, rows.length);

  const columnSpecs = normalizeColumnSpecs(model.columnSpecs, columnCount);
  const strokes = normalizeStrokes(model.strokes, rows.length, columnCount);

  const caption =
    model.caption && model.caption.length > 0 ? model.caption : undefined;

  return {
    rows,
    headerRows: headerRows > 0 ? headerRows : undefined,
    caption,
    columnSpecs,
    strokes,
  };
}

//#region internals

const EMPTY_CELL: Cell = { text: "" };

function createEmptyCell(): Cell {
  return { ...EMPTY_CELL };
}

function cloneCell(cell: Cell): Cell {
  return {
    text: cell.text,
    align: cell.align,
    bold: cell.bold,
    italic: cell.italic,
  };
}

function normalizeCell(cell?: CellInit | Cell): Cell {
  const base = cell ?? EMPTY_CELL;
  const text = base.text ?? "";

  const result: Cell = {
    text,
  };

  const align = base.align;
  if (align) {
    result.align = align;
  }

  const bold = base.bold;
  if (bold !== undefined) {
    result.bold = bold;
  }

  const italic = base.italic;
  if (italic !== undefined) {
    result.italic = italic;
  }

  return result;
}

function normalizeRow(row: RowInit, columnCount: number): Cell[] {
  const normalized = Array.from({ length: columnCount }, (_, index) =>
    row[index] !== undefined
      ? normalizeCell(row[index] as Partial<Cell>)
      : createEmptyCell(),
  );

  return normalized;
}

function normalizeColumnSpecs(
  specs: ReadonlyArray<ColumnSpec | undefined> | ColumnSpec[] | undefined,
  columnCount: number,
): ColumnSpec[] | undefined {
  if (!specs || specs.length === 0) {
    return undefined;
  }

  const normalized: ColumnSpec[] = Array.from(
    { length: columnCount },
    (_, index) => {
      const spec = specs[index];
      if (!spec) {
        return {} as ColumnSpec;
      }

      const next: ColumnSpec = {};
      if (spec.width === "auto") {
        next.width = "auto";
      } else if (spec.width !== undefined) {
        const numericWidth = spec.width;
        if (numericWidth > 0) {
          next.width = numericWidth;
        }
      }

      if (spec.align) {
        next.align = spec.align;
      }

      return next;
    },
  );

  const hasValues = normalized.some(
    (spec) => spec.width !== undefined || spec.align !== undefined,
  );

  return hasValues ? normalized : undefined;
}

function normalizeStrokes(
  strokes: TableStrokes | undefined,
  rowCount: number,
  columnCount: number,
): TableStrokes | undefined {
  if (!strokes) {
    return undefined;
  }

  const rows = normalizeStrokeArray(
    strokes.rows,
    rowCount,
    normalizeRowStroke,
    createRowStroke,
  );
  const columns = normalizeStrokeArray(
    strokes.columns,
    columnCount,
    normalizeColumnStroke,
    createColumnStroke,
  );

  const hasRows = rows?.some(hasRowStrokeValues) ?? false;
  const hasColumns = columns?.some(hasColumnStrokeValues) ?? false;

  if (!hasRows && !hasColumns) {
    return undefined;
  }

  return {
    rows: hasRows ? (rows ?? undefined) : undefined,
    columns: hasColumns ? (columns ?? undefined) : undefined,
  };
}

function normalizeRowStroke(stroke: RowStroke): RowStroke {
  const result: RowStroke = {};

  const top = normalizeStrokeValue(stroke.top);
  if (top !== undefined) {
    result.top = top;
  }

  const bottom = normalizeStrokeValue(stroke.bottom);
  if (bottom !== undefined) {
    result.bottom = bottom;
  }

  return result;
}

function normalizeColumnStroke(stroke: ColumnStroke): ColumnStroke {
  const result: ColumnStroke = {};

  const left = normalizeStrokeValue(stroke.left);
  if (left !== undefined) {
    result.left = left;
  }

  const right = normalizeStrokeValue(stroke.right);
  if (right !== undefined) {
    result.right = right;
  }

  return result;
}

function normalizeStrokeValue(
  value: StrokeValue | undefined,
): StrokeValue | undefined {
  if (value === "none") {
    return "none";
  }
  if (value !== undefined && value > 0) {
    return value;
  }
  return undefined;
}

function hasRowStrokeValues(stroke: RowStroke): boolean {
  return stroke.top !== undefined || stroke.bottom !== undefined;
}

function hasColumnStrokeValues(stroke: ColumnStroke): boolean {
  return stroke.left !== undefined || stroke.right !== undefined;
}

function createRowStroke(): RowStroke {
  return {};
}

function createColumnStroke(): ColumnStroke {
  return {};
}

function cloneStrokes(strokes: TableStrokes): TableStrokes {
  return {
    rows: strokes.rows?.map((stroke) => ({ ...stroke })),
    columns: strokes.columns?.map((stroke) => ({ ...stroke })),
  };
}

function ensureStrokeArray<T extends StrokeEntry>(
  entries: ReadonlyArray<T> | undefined,
  length: number,
  createDefault: () => T,
): T[] {
  const result = Array.from({ length }, (_, idx) =>
    entries?.[idx] ? { ...entries[idx] } : createDefault(),
  );
  return result;
}

function normalizeStrokeArray<T extends StrokeEntry>(
  entries: ReadonlyArray<T> | undefined,
  length: number,
  normalize: (entry: T) => T,
  createDefault: () => T,
): T[] | undefined {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  return Array.from({ length }, (_, index) =>
    entries[index] ? normalize(entries[index]) : createDefault(),
  );
}

function getColumnCount(rows: ReadonlyArray<ReadonlyArray<Cell>>): number {
  return rows.reduce(
    (max, row) => Math.max(max, row.length),
    rows[0]?.length ?? 0,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
}

function assertInBounds(
  index: number,
  length: number,
  label: "rowIndex" | "columnIndex",
): void {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new RangeError(`${label} is out of bounds`);
  }
}

function assertInsertIndex(
  index: number,
  length: number,
  label: "rowIndex" | "columnIndex",
): void {
  if (!Number.isInteger(index) || index < 0 || index > length) {
    throw new RangeError(`${label} is out of bounds for insertion`);
  }
}

//#endregion
