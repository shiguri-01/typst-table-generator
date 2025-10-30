import {
  type CellPosition,
  dimensions,
  isInBounds,
  type Table,
} from "@/domain/typst/table/table";
import { clamp } from "@/lib/utils";

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export const normalizeRange = (
  table: Table,
  range: CellRange,
): CellRange | null => {
  const { start, end } = range;

  // 完全に範囲外ならnullを返す
  // start, end両方が画面外であってもtableと領域が重なる場合があるが、
  // ここでは単純に範囲外とみなす
  if (!isInBounds(table, start) && !isInBounds(table, end)) {
    return null;
  }

  const { rows, columns } = dimensions(table);

  const clampedStart = {
    row: clamp(start.row, 0, rows - 1),
    column: clamp(start.column, 0, columns - 1),
  };
  const clampedEnd = {
    row: clamp(end.row, 0, rows - 1),
    column: clamp(end.column, 0, columns - 1),
  };

  const actualStart: CellPosition = {
    row: Math.min(clampedStart.row, clampedEnd.row),
    column: Math.min(clampedStart.column, clampedEnd.column),
  };
  const actualEnd: CellPosition = {
    row: Math.max(clampedStart.row, clampedEnd.row),
    column: Math.max(clampedStart.column, clampedEnd.column),
  };

  return { start: actualStart, end: actualEnd };
};
