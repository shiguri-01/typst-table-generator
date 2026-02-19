import "@shiguri/solid-grid/preset-tailwind.css";

import {
  type CellPatch,
  type CellRenderContext,
  clipboardTextPlugin,
  createPluginHost,
  deletePlugin,
  editingPlugin,
  Gridsheet,
  selectionPlugin,
} from "@shiguri/solid-grid";
import { cva } from "class-variance-authority";
import { createMemo } from "solid-js";
import type { Cell } from "@/domain/typst/table/cell";
import type { CellPosition } from "@/domain/typst/table/table";
import { cn } from "@/lib/utils";
import {
  cellStrokeAt,
  selectCellRange,
  setActiveCell,
  tableEditorStore,
  updateTable,
} from "../store";
import { createColumnTitle } from "../utils";

const cellTextStyles = cva(
  "h-full min-h-7 w-full border-0 bg-transparent px-2 py-1 text-sm outline-none",
  {
    variants: {
      alignH: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      },
      alignV: {
        top: "align-top",
        horizon: "align-middle",
        bottom: "align-bottom",
      },
      bold: {
        true: "font-bold",
      },
      italic: {
        true: "italic",
      },
    },
  },
);

const pluginHost = createPluginHost<Cell>([
  selectionPlugin(),
  editingPlugin(),
  deletePlugin({
    getEmptyValue: () => ({ content: "" }),
  }),
  clipboardTextPlugin({
    getData: () => tableEditorStore().table.rows as Cell[][],
    parseCell: (raw) => ({ content: raw }),
    formatCell: (value) => value.content,
    getEmptyValue: () => ({ content: "" }),
  }),
]);

const applyGridPatches = (
  table: ReturnType<typeof tableEditorStore>["table"],
  patches: CellPatch<Cell>[],
) => {
  const nextRows = table.rows.map((row) => row.slice());
  for (const { pos, value } of patches) {
    if (!nextRows[pos.row]?.[pos.col]) {
      continue;
    }
    nextRows[pos.row][pos.col] = value;
  }

  return {
    ...table,
    rows: nextRows,
  };
};

const renderCell = (ctx: CellRenderContext<Cell>) => {
  const state = tableEditorStore();
  const stroke = cellStrokeAt(state, { row: ctx.row, column: ctx.col });
  const styleClass = cellTextStyles({
    alignH: ctx.value.align?.horizontal,
    alignV: ctx.value.align?.vertical,
    bold: ctx.value.bold,
    italic: ctx.value.italic,
  });

  if (ctx.isEditing) {
    return (
      <input
        value={ctx.value.content}
        class={cn(styleClass, "bg-bg")}
        aria-label="cell input"
        onInput={(event) => {
          ctx.commitEdit({
            ...ctx.value,
            content: event.currentTarget.value,
          });
        }}
        onBlur={() => {
          ctx.cancelEditing();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            ctx.cancelEditing();
          }
        }}
      />
    );
  }

  return (
    <div
      class={cn(
        styleClass,
        "grid h-full items-center",
        ctx.isSelected && "bg-primary-subtle",
        stroke.top && "border-t border-t-fg",
        stroke.bottom && "border-b border-b-fg",
        stroke.left && "border-l border-l-fg",
        stroke.right && "border-r border-r-fg",
      )}
    >
      {ctx.value.content}
    </div>
  );
};

const toGridPos = (pos: CellPosition | null) => {
  if (!pos) {
    return null;
  }
  return { row: pos.row, col: pos.column };
};

export function TableEditorGrid() {
  const gridState = createMemo(() => {
    const state = tableEditorStore();
    const { selection, activeCell } = state;

    return {
      data: state.table.rows as Cell[][],
      activeCell: toGridPos(activeCell),
      selection: selection
        ? {
            min: {
              row: selection.start.row,
              col: selection.start.column,
            },
            max: {
              row: selection.end.row,
              col: selection.end.column,
            },
          }
        : null,
    };
  });

  return (
    <div class="overflow-auto rounded-md border border-border bg-bg">
      <Gridsheet
        data={gridState().data}
        renderCell={renderCell}
        activeCell={gridState().activeCell}
        selection={gridState().selection}
        onActiveCellChange={(pos) => {
          if (!pos) {
            return;
          }
          setActiveCell({ row: pos.row, column: pos.col });
        }}
        onSelectionChange={(range) => {
          if (!range) {
            return;
          }
          selectCellRange({
            start: { row: range.min.row, column: range.min.col },
            end: { row: range.max.row, column: range.max.col },
          });
        }}
        onCellsChange={(patches) => {
          updateTable((table) => applyGridPatches(table, patches));
        }}
        onEvent={pluginHost.onEvent}
        renderColHeader={({ index }) => (
          <div class="px-2 py-1 text-center text-xs font-semibold text-muted-fg">
            {createColumnTitle(index)}
          </div>
        )}
        renderRowHeader={({ index }) => (
          <div class="px-2 py-1 text-center text-xs font-semibold text-muted-fg">
            {index + 1}
          </div>
        )}
        class="w-full"
        classes={{
          header: "bg-muted",
          corner: "border-b border-r border-border bg-muted",
          rowHeader: ({ isSelected }) =>
            cn(
              "border-b border-r border-border bg-muted",
              isSelected && "bg-primary-subtle",
            ),
          colHeader: ({ isSelected }) =>
            cn(
              "border-b border-r border-border bg-muted",
              isSelected && "bg-primary-subtle",
            ),
          row: () => "border-b border-border",
          cell: (cellCtx) =>
            cn(
              "border-r border-border align-top",
              cellCtx.isActive && "ring-2 ring-primary/60 ring-inset",
            ),
        }}
      />
    </div>
  );
}
