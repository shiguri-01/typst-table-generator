import { DEFAULT_ALIGN, formatAlign } from "../alignment";
import { formatArray } from "../array";
import { formatEmph, formatStrong } from "../emphasis";
import {
  type EscapeOption,
  escapeSet,
  formatFunction,
  toContentBlock,
} from "../utils/format";
import type { Cell } from "./cell";
import type { ColumnSpec } from "./column";
import type { Row } from "./row";
import type { Table } from "./table";

/**
 * Render a single {@link Cell} into Typst inline content.
 *
 * - Applies optional escaping, italic/bold markers, and wraps as a content
 *   block `[ ... ]`.
 * - When `cell.align` is provided, emits `table.cell(align: ..., [content])`.
 */
export const renderCell = (
  cell: Cell,
  {
    escapeContent,
  }: {
    escapeContent?: EscapeOption;
  },
): string => {
  let content = cell.content;
  if (escapeContent) {
    content = escapeSet(content, escapeContent);
  }
  if (cell.italic) content = formatEmph(content);
  if (cell.bold) content = formatStrong(content);

  // Cellについて、table.cell()の引数と、emph系とは分けた構造にしたほうがいいかも
  // オプション（table.cell()の引数）がある場合
  if (cell.align) {
    return formatFunction(
      {
        name: "table.cell",
        args: {
          unnamed: toContentBlock(content),
          named: {
            align: formatAlign(cell.align),
          },
        },
      },
      {
        multipleLine: false,
      },
    );
  }

  return toContentBlock(content);
};

/** Render a row by joining rendered cells with `, `. */
export const renderRow = (
  row: Row,
  { escapeCellContent }: { escapeCellContent?: EscapeOption },
): string => {
  return row
    .map((cell) => {
      return renderCell(cell, {
        escapeContent: escapeCellContent,
      });
    })
    .join(", ");
};

const STROKE_LINE = "1pt";
const STROKE_NONE = "none";

const renderVline = (x?: number) =>
  formatFunction({
    name: "table.vline",
    args: x !== undefined ? { named: { x: String(x) } } : {},
  });

const renderHline = (y?: number) =>
  formatFunction({
    name: "table.hline",
    args: y !== undefined ? { named: { y: String(y) } } : {},
  });

/** How to emit the `columns` argument of `table(...)`. */
export type ColumnsArgStyle = "autoArray" | "count";

/** Options that control how a table is rendered to Typst. */
export type TableFormattingOptions = {
  /**
   * How to emit the `columns` argument.
   * - `autoArray` → `(auto, auto, ...)` with length = column count.
   * - `count`     → `n` shorthand.
   * @defaultValue "autoArray"
   */
  columnsArgStyle?: ColumnsArgStyle;
  /**
   * Whether to escape cell content.
   * @defaultValue false
   */
  escapeCellContent?: EscapeOption;
};

/** Default {@link TableFormattingOptions}. */
export const DEFAULT_FORMAT_TABLE_OPTIONS: Required<TableFormattingOptions> = {
  columnsArgStyle: "autoArray",
  escapeCellContent: false,
} as const;

const toColumnsArg = (
  specs: readonly ColumnSpec[],
  style: ColumnsArgStyle,
): string => {
  if (style === "count") {
    return String(specs.length);
  }
  return formatArray(Array.from({ length: specs.length }, () => "auto"));
};

const toAlignArg = (specs: readonly ColumnSpec[]): string => {
  if (specs.every((spec) => !spec.align)) {
    return formatAlign(DEFAULT_ALIGN);
  }
  return formatArray(
    specs.map((spec) => formatAlign(spec.align ?? DEFAULT_ALIGN)),
  );
};

const toStrokeArg = ({
  allHorizontal,
  allVertical,
}: {
  allHorizontal: boolean;
  allVertical: boolean;
}): string => {
  if (allHorizontal && allVertical) {
    return STROKE_LINE;
  }
  if (allHorizontal) {
    return `(x: ${STROKE_LINE}, y: ${STROKE_NONE})`;
  }
  if (allVertical) {
    return `(x: ${STROKE_NONE}, y: ${STROKE_LINE})`;
  }
  return STROKE_NONE;
};

/**
 * Render a {@link Table} to a Typst `table(...)` call (multi-line).
 *
 * - Emits `table.header(...)` for header rows, then body rows.
 * - Compacts full-stroke grids to `stroke: 1pt` or `(x|y)` shorthand.
 * - Otherwise places `table.hline()` at visual boundaries and appends
 *   `table.vline(x: k)` calls for vertical lines.
 */
export function renderTable(
  table: Table,
  options: TableFormattingOptions = {},
): string {
  const opt: Required<TableFormattingOptions> = {
    ...DEFAULT_FORMAT_TABLE_OPTIONS,
    ...options,
  };

  const allHLines = table.strokes.row.every(Boolean);
  const allVLines = table.strokes.column.every(Boolean);
  const headersRowsCount = table.headerRows ?? 0;

  const hline = renderHline();

  const contentParts: string[] = [];

  // 行とその上線を出力する関数
  const renderRowWithTopLine = (rowIndex: number): string[] => {
    const row = table.rows[rowIndex];
    if (!row) return [];

    const lines: string[] = [];
    if (!allHLines && table.strokes.row[rowIndex]) {
      lines.push(hline);
    }
    lines.push(renderRow(row, { escapeCellContent: opt.escapeCellContent }));
    return lines;
  };

  // ヘッダー行
  if (headersRowsCount > 0) {
    const headerLines: string[] = [];
    for (let i = 0; i < headersRowsCount; i++) {
      headerLines.push(...renderRowWithTopLine(i));
    }

    contentParts.push(
      formatFunction(
        {
          name: "table.header",
          args: { unnamed: headerLines.join(",\n") },
        },
        { multipleLine: true },
      ),
    );
  }

  // ボディ行
  for (let i = headersRowsCount; i < table.rows.length; i++) {
    contentParts.push(...renderRowWithTopLine(i));
  }

  // 最後のhline（テーブル全体の下線）
  if (!allHLines && table.strokes.row[table.rows.length]) {
    contentParts.push(hline);
  }

  // 縦線
  if (!allVLines) {
    table.strokes.column.forEach((useLine, i) => {
      if (useLine) {
        contentParts.push(renderVline(i));
      }
    });
  }

  return formatFunction(
    {
      name: "table",
      args: {
        unnamed: contentParts.join(",\n"),
        named: {
          columns: toColumnsArg(table.columnSpecs, opt.columnsArgStyle),
          align: toAlignArg(table.columnSpecs),
          stroke: toStrokeArg({
            allHorizontal: allHLines,
            allVertical: allVLines,
          }),
        },
      },
    },
    { multipleLine: true },
  );
}
