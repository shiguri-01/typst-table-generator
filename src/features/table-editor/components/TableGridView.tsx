"use client";

import "react-datasheet-grid/dist/style.css";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  type CellComponent,
  type Column,
  DynamicDataSheetGrid,
  keyColumn,
  type Operation,
  type SelectionWithId,
} from "react-datasheet-grid";
import type { Cell } from "@/lib/table";
import { cn } from "@/lib/utils";
import { useTableEditorStore } from "../store";

type RowRecord = Record<string, Cell>;

const EMPTY_CELL: Cell = { text: "" };

const columnKey = (index: number) => `c${index}`;

const toRowRecord = (row: Cell[], columnCount: number): RowRecord => {
  const record: RowRecord = {};
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    record[columnKey(columnIndex)] = {
      ...EMPTY_CELL,
      ...(row[columnIndex] ?? EMPTY_CELL),
    };
  }
  return record;
};

const recordToCells = (record: RowRecord, columnCount: number): Cell[] => {
  const cells: Cell[] = [];
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    cells[columnIndex] = {
      ...EMPTY_CELL,
      ...(record[columnKey(columnIndex)] ?? EMPTY_CELL),
    };
  }
  return cells;
};

const cellsEqual = (left: Cell, right: Cell) =>
  left.text === right.text &&
  left.align === right.align &&
  left.bold === right.bold &&
  left.italic === right.italic;

type TableSelectionRange = {
  start: { rowIndex: number; columnIndex: number };
  end: { rowIndex: number; columnIndex: number };
};

const rangesEqual = (
  left: TableSelectionRange | null,
  right: TableSelectionRange | null,
) => {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.start.rowIndex === right.start.rowIndex &&
    left.start.columnIndex === right.start.columnIndex &&
    left.end.rowIndex === right.end.rowIndex &&
    left.end.columnIndex === right.end.columnIndex
  );
};

const positionsEqual = (
  left: { rowIndex: number; columnIndex: number } | null,
  right: { rowIndex: number; columnIndex: number } | null,
) => {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.rowIndex === right.rowIndex && left.columnIndex === right.columnIndex
  );
};

const isCellBlank = (cell: Cell) =>
  (cell.text ?? "").length === 0 && !cell.bold && !cell.italic && !cell.align;

export function TableGridView() {
  const rows = useTableEditorStore((state) => state.model.rows);
  const headerRows = useTableEditorStore(
    (state) => state.model.headerRows ?? 0,
  );
  const actions = useTableEditorStore((state) => state.actions);

  const columnCount = rows[0]?.length ?? 0;

  const gridRows = useMemo(
    () => rows.map((row) => toRowRecord(row, columnCount)),
    [rows, columnCount],
  );

  const previousRowsRef = useRef<RowRecord[]>(gridRows);
  const columnCountRef = useRef(columnCount);

  useEffect(() => {
    previousRowsRef.current = gridRows;
  }, [gridRows]);

  useEffect(() => {
    columnCountRef.current = columnCount;
  }, [columnCount]);

  const cellColumn = useMemo(() => {
    const component: CellComponent<RowRecord, { key: string }> = ({
      rowData,
      columnData,
      rowIndex,
      columnIndex,
      setRowData,
      active,
      focus,
      stopEditing,
    }) => {
      const key = columnData.key;
      const cell = rowData[key] ?? EMPTY_CELL;
      const isHeader = rowIndex < headerRows;

      const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextRow: RowRecord = {
          ...rowData,
          [key]: { ...cell, text: event.target.value },
        };
        setRowData(nextRow);
      };

      const alignClass =
        cell.align === "center"
          ? "justify-center text-center"
          : cell.align === "right"
            ? "justify-end text-right"
            : "justify-start text-left";

      const emphasisClass = cn(
        cell.bold && "font-semibold",
        cell.italic && "italic",
      );

      return (
        <div
          data-ttg-header={isHeader ? "true" : undefined}
          aria-description={isHeader ? "Header row" : undefined}
          className={cn(
            "relative flex h-full w-full items-center border-r border-border/40 px-3 py-2 text-sm transition",
            alignClass,
            emphasisClass,
            isHeader ? "bg-muted/40" : "bg-background",
            active
              ? "ring-2 ring-primary"
              : focus
                ? "ring-1 ring-primary/40"
                : "ring-0",
          )}
        >
          <input
            value={cell.text ?? ""}
            onChange={handleChange}
            onBlur={() => stopEditing()}
            aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
            className="w-full bg-transparent text-inherit outline-none"
          />
        </div>
      );
    };

    const column: Partial<Column<RowRecord, { key: string }, string>> = {
      component,
      minWidth: 120,
      basis: 150,
      grow: 1,
      shrink: 1,
    };

    return column;
  }, [headerRows]);

  const columns = useMemo(() => {
    const baseColumns: Partial<Column<RowRecord, { key: string }, string>>[] =
      [];
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const key = columnKey(columnIndex);
      baseColumns.push({
        id: key,
        title: `Column ${columnIndex + 1}`,
        ...keyColumn<RowRecord, string>(key, cellColumn),
      });
    }
    return baseColumns;
  }, [cellColumn, columnCount]);

  const handleChange = useCallback(
    (nextRows: RowRecord[], operations: Operation[]) => {
      const previousRows = previousRowsRef.current;
      const currentColumnCount = columnCountRef.current;
      const rowsToDelete = new Set<number>();

      operations.forEach((operation) => {
        switch (operation.type) {
          case "UPDATE": {
            for (
              let rowIndex = operation.fromRowIndex;
              rowIndex < operation.toRowIndex;
              rowIndex += 1
            ) {
              const previousCells = recordToCells(
                previousRows[rowIndex],
                currentColumnCount,
              );
              const nextCells = recordToCells(
                nextRows[rowIndex],
                currentColumnCount,
              );

              for (
                let columnIndex = 0;
                columnIndex < currentColumnCount;
                columnIndex += 1
              ) {
                const prevCell = previousCells[columnIndex];
                const nextCell = nextCells[columnIndex];
                if (!cellsEqual(prevCell, nextCell)) {
                  actions.editCell(
                    { rowIndex, columnIndex },
                    {
                      text: nextCell.text,
                      align: nextCell.align,
                      bold: nextCell.bold,
                      italic: nextCell.italic,
                    },
                  );
                }
              }
            }
            break;
          }
          case "CREATE": {
            for (
              let rowIndex = operation.fromRowIndex;
              rowIndex < operation.toRowIndex;
              rowIndex += 1
            ) {
              actions.insertRow(rowIndex);
              const insertedCells = recordToCells(
                nextRows[rowIndex],
                currentColumnCount,
              );
              insertedCells.forEach((cell, columnIndex) => {
                if (!isCellBlank(cell)) {
                  actions.editCell(
                    { rowIndex, columnIndex },
                    {
                      text: cell.text,
                      align: cell.align,
                      bold: cell.bold,
                      italic: cell.italic,
                    },
                  );
                }
              });
            }
            break;
          }
          case "DELETE": {
            for (
              let rowIndex = operation.fromRowIndex;
              rowIndex < operation.toRowIndex;
              rowIndex += 1
            ) {
              rowsToDelete.add(rowIndex);
            }
            break;
          }
          default:
            break;
        }
      });

      if (rowsToDelete.size > 0) {
        actions.removeRows([...rowsToDelete].sort((a, b) => a - b));
      }

      previousRowsRef.current = nextRows;
    },
    [actions],
  );

  const handleActiveCellChange = useCallback(
    ({ cell }: { cell: SelectionWithId["min"] | null }) => {
      const state = useTableEditorStore.getState();
      const nextActive = cell
        ? { rowIndex: cell.row, columnIndex: cell.col }
        : null;
      if (positionsEqual(state.selection.active, nextActive)) {
        return;
      }
      actions.setSelection({
        active: nextActive,
        range: state.selection.range,
      });
    },
    [actions],
  );

  const handleSelectionChange = useCallback(
    ({ selection }: { selection: SelectionWithId | null }) => {
      const state = useTableEditorStore.getState();
      if (!selection) {
        if (state.selection.range === null) {
          return;
        }
        actions.setSelection({
          active: state.selection.active,
          range: null,
        });
        return;
      }
      const normalizedRange: TableSelectionRange = {
        start: {
          rowIndex: Math.min(selection.min.row, selection.max.row),
          columnIndex: Math.min(selection.min.col, selection.max.col),
        },
        end: {
          rowIndex: Math.max(selection.min.row, selection.max.row),
          columnIndex: Math.max(selection.min.col, selection.max.col),
        },
      };

      if (rangesEqual(state.selection.range, normalizedRange)) {
        return;
      }

      actions.setSelection({
        active: state.selection.active,
        range: normalizedRange,
      });
    },
    [actions],
  );

  if (columnCount === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-fg">
        Add columns to start editing.
      </div>
    );
  }

  return (
    <DynamicDataSheetGrid<RowRecord>
      className="ds-grid h-full w-full"
      value={gridRows}
      onChange={handleChange}
      columns={columns}
      headerRowHeight={40}
      rowHeight={40}
      gutterColumn={false}
      stickyRightColumn={false}
      rowClassName={({ rowIndex }) =>
        rowIndex < headerRows ? "bg-muted/20" : undefined
      }
      createRow={() => toRowRecord([], columnCount)}
      duplicateRow={({ rowData }) => ({ ...rowData })}
      onActiveCellChange={handleActiveCellChange}
      onSelectionChange={handleSelectionChange}
    />
  );
}
