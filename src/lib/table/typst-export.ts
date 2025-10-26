/**
 * Typst export helpers – convert {@link TableModel} structures into snippets.
 *
 * The conversion rules mirror `_docs/spec.md` (section 6+5.1): column widths are
 * rendered as `(auto | <pt>)`, column alignment only appears when a column
 * deviates from the default `'left'`, header rows become `table.header`, and
 * row/column strokes are mapped to `table.hline` / `table.vline` with pt units.
 */
import {
  type Align,
  type Cell,
  getTableDimensions,
  normalizeTableModel,
  type StrokeValue,
  type TableModel,
} from "./model";

/**
 * Formatting levers for {@link renderTableModelToTypst}.
 */
export interface TypstExportOptions {
  /**
   * Indentation sequence for nested blocks. The serializer never mixes tabs and
   * spaces on its own, so callers can inject project-specific conventions.
   * @defaultValue `"  "`
   */
  indent?: string;
  /**
   * Overrides the `repeat` flag passed to `table.header`. The spec defaults to
   * repeated headers so large tables keep their headings across pages.
   * @defaultValue `true`
   */
  repeatHeader?: boolean;
  /**
   * When `true`, a table with a non-empty caption is wrapped in `#figure` and
   * the caption is emitted as `caption: […]`. Disable this if the surrounding
   * caller already handles figure wrapping.
   * @defaultValue `true`
   */
  wrapFigure?: boolean;
}

/**
 * Render a {@link TableModel} into Typst code that satisfies the invariants in
 * `_docs/spec.md`. The function normalizes a copy of the model first so callers
 * can provide partially-populated structures (e.g. ragged rows) without
 * repeating the same guards. Output is formatted with predictable indentation
 * so snapshot tests remain stable.
 *
 * The generated snippet is self-sufficient: header rows, optional figure
 * wrapping, column hints, and boundary strokes are all emitted when present.
 */
export function renderTableModelToTypst(
  model: TableModel,
  options: TypstExportOptions = {},
): string {
  const normalized = normalizeTableModel(model);

  const indent = options.indent ?? "  ";
  const repeatHeader = options.repeatHeader ?? true;
  const wrapFigure = options.wrapFigure ?? true;

  const tableLines = renderTableBodyToTypst(normalized, indent, repeatHeader);

  if (normalized.caption && wrapFigure) {
    const figureLines: string[] = [
      "#figure(",
      `${indent}caption: [${escapeTypstInline(normalized.caption)}],`,
      `${indent}body: [`,
      ...indentLines(tableLines, indent),
      `${indent}],`,
      ")",
    ];
    return figureLines.join("\n");
  }

  return tableLines.join("\n");
}

function renderTableBodyToTypst(
  model: TableModel,
  indent: string,
  repeatHeader: boolean,
): string[] {
  const lines: string[] = ["#table("];
  const { columnCount } = getTableDimensions(model);

  const columnWidths = buildColumnWidthTuple(model, columnCount);
  lines.push(`${indent}columns: ${formatTuple(columnWidths)},`);

  const columnAligns = buildColumnAlignTuple(model, columnCount);
  if (columnAligns.some((align) => align !== "left")) {
    lines.push(`${indent}align: ${formatTuple(columnAligns)},`);
  }

  const { hLines, vLines } = collectStrokeCommands(model, columnCount);

  const headerCount = model.headerRows ?? 0;
  if (headerCount > 0) {
    lines.push(
      `${indent}table.header(repeat: ${repeatHeader ? "true" : "false"})[`,
    );
    const headerIndent = indent + indent;
    for (let rowIndex = 0; rowIndex < headerCount; rowIndex += 1) {
      lines.push(
        `${headerIndent}${renderRow(model.rows[rowIndex], columnAligns)},`,
      );
    }
    lines.push(`${indent}],`);
  }

  hLines.forEach((entry) => {
    lines.push(
      `${indent}table.hline(y: ${entry.index}, stroke: ${entry.stroke}),`,
    );
  });

  vLines.forEach((entry) => {
    lines.push(
      `${indent}table.vline(x: ${entry.index}, stroke: ${entry.stroke}),`,
    );
  });

  for (
    let rowIndex = headerCount;
    rowIndex < model.rows.length;
    rowIndex += 1
  ) {
    lines.push(`${indent}${renderRow(model.rows[rowIndex], columnAligns)},`);
  }

  lines.push(")");
  return lines;
}

function buildColumnWidthTuple(
  model: TableModel,
  columnCount: number,
): string[] {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const width = model.columnSpecs?.[columnIndex]?.width ?? "auto";
    if (width === "auto") {
      return "auto";
    }
    return `${formatNumeric(width)}pt`;
  });
}

function buildColumnAlignTuple(
  model: TableModel,
  columnCount: number,
): Align[] {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    return model.columnSpecs?.[columnIndex]?.align ?? "left";
  });
}

/**
 * Flatten row / column stroke maps into Typst `hline` / `vline` calls.
 * Later entries override earlier ones to respect "last write wins" semantics.
 */
function collectStrokeCommands(
  model: TableModel,
  columnCount: number,
): {
  hLines: Array<{ index: number; stroke: string }>;
  vLines: Array<{ index: number; stroke: string }>;
} {
  const rowCount = model.rows.length;
  const strokeRows = model.strokes?.rows ?? [];
  const strokeColumns = model.strokes?.columns ?? [];

  const horizontal = new Map<number, string>();
  for (let row = 0; row < rowCount; row += 1) {
    const stroke = strokeRows[row];
    if (!stroke) {
      continue;
    }

    if (stroke.top && stroke.top !== "none") {
      horizontal.set(row, formatStrokeValue(stroke.top));
    }
    if (stroke.bottom && stroke.bottom !== "none") {
      horizontal.set(row + 1, formatStrokeValue(stroke.bottom));
    }
  }

  const vertical = new Map<number, string>();
  for (let column = 0; column < columnCount; column += 1) {
    const stroke = strokeColumns[column];
    if (!stroke) {
      continue;
    }

    if (stroke.left && stroke.left !== "none") {
      vertical.set(column, formatStrokeValue(stroke.left));
    }
    if (stroke.right && stroke.right !== "none") {
      vertical.set(column + 1, formatStrokeValue(stroke.right));
    }
  }

  return {
    hLines: [...horizontal.entries()]
      .map(([index, stroke]) => ({ index, stroke }))
      .sort((a, b) => a.index - b.index),
    vLines: [...vertical.entries()]
      .map(([index, stroke]) => ({ index, stroke }))
      .sort((a, b) => a.index - b.index),
  };
}

function renderRow(row: Cell[], columnAligns: Align[]): string {
  return row
    .map((cell, columnIndex) =>
      renderCell(cell, columnAligns[columnIndex] ?? "left"),
    )
    .join(" ");
}

function renderCell(cell: Cell, columnAlign: Align): string {
  const text = escapeTypstInline(cell.text);
  let content = text;
  if (cell.italic) {
    content = `emph[${content}]`;
  }
  if (cell.bold) {
    content = `strong[${content}]`;
  }

  const bracketed = `[${content}]`;
  if (cell.align && cell.align !== columnAlign) {
    return `table.cell(align: ${cell.align})${bracketed}`;
  }

  return bracketed;
}

const INLINE_ESCAPE_CHARS = new Set(["#", "[", "]"]);

/**
 * Typst encloses inline text with `[...]` and reserves `#` for expressions.
 * Insert a protecting backslash whenever user text contains one of those
 * markers and it is not already escaped. Existing escape sequences remain
 * untouched (odd number of trailing backslashes).
 */
function escapeTypstInline(value: string): string {
  if (value.length === 0) {
    return "";
  }

  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let result = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (INLINE_ESCAPE_CHARS.has(char) && !isEscaped(normalized, index)) {
      result += "\\";
    }
    result += char;
  }
  return result;
}

function isEscaped(source: string, index: number): boolean {
  let backslashCount = 0;
  for (let lookback = index - 1; lookback >= 0; lookback -= 1) {
    if (source[lookback] === "\\") {
      backslashCount += 1;
    } else {
      break;
    }
  }
  return backslashCount % 2 === 1;
}

function formatNumeric(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return Number(value.toFixed(3)).toString();
}

function formatStrokeValue(value: StrokeValue): string {
  if (value === "none") {
    return "none";
  }
  return `${formatNumeric(value)}pt`;
}

function formatTuple(items: string[]): string {
  if (items.length === 0) {
    return "()";
  }
  if (items.length === 1) {
    return `(${items[0]})`;
  }
  return `(${items.join(", ")})`;
}

function indentLines(lines: string[], indent: string): string[] {
  return lines.map((line) => `${indent}${line}`);
}
