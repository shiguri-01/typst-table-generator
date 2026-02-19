import "@shiguri/solid-grid/preset-tailwind.css";

import {
  type CellPatch,
  type CellRenderContext,
  clipboardTextPlugin,
  createPluginHost,
  deletePlugin,
  editingPlugin,
  type GridApi,
  type GridEvent,
  type GridPlugin,
  Gridsheet,
  selectionPlugin,
} from "@shiguri/solid-grid";
import { cva } from "class-variance-authority";
import { createMemo, createSignal, onMount } from "solid-js";
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

const mouseEditingPlugin = (): GridPlugin<Cell> => ({
  name: "mouse-editing",
  onEvent(ev: GridEvent, api: GridApi<Cell>) {
    if (ev.type !== "cell:pointerdown") {
      return;
    }
    if (ev.e.button !== 0 || ev.e.detail < 2) {
      return;
    }
    if (api.isEditing()) {
      return;
    }
    ev.e.preventDefault();
    api.beginEdit(ev.pos);
    return true;
  },
});

const pluginHost = createPluginHost<Cell>([
  mouseEditingPlugin(),
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

const areCellsEqual = (a: Cell, b: Cell): boolean => {
  const aAlignH = a.align?.horizontal;
  const aAlignV = a.align?.vertical;
  const bAlignH = b.align?.horizontal;
  const bAlignV = b.align?.vertical;

  return (
    a.content === b.content &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    aAlignH === bAlignH &&
    aAlignV === bAlignV
  );
};

const applyGridPatches = (
  table: ReturnType<typeof tableEditorStore>["table"],
  patches: CellPatch<Cell>[],
) => {
  const nextRows = table.rows.slice();
  const clonedRows = new Map<number, Cell[]>();
  let hasChanges = false;

  for (const { pos, value } of patches) {
    const currentRow = table.rows[pos.row];
    const currentCell = currentRow?.[pos.col];
    if (!currentCell) {
      continue;
    }

    if (areCellsEqual(currentCell, value)) {
      continue;
    }

    let rowDraft = clonedRows.get(pos.row);
    if (!rowDraft) {
      rowDraft = currentRow.slice();
      clonedRows.set(pos.row, rowDraft);
      nextRows[pos.row] = rowDraft;
    }
    rowDraft[pos.col] = value;
    hasChanges = true;
  }

  if (!hasChanges) {
    return table;
  }

  return {
    ...table,
    rows: nextRows,
  };
};

interface CellEditorProps {
  ctx: CellRenderContext<Cell>;
  class: string;
}

const CellEditor = (props: CellEditorProps) => {
  const [draft, setDraft] = createSignal(props.ctx.value.content);
  let inputRef: HTMLInputElement | undefined;
  let closed = false;

  const commit = () => {
    if (closed) {
      return;
    }
    closed = true;
    if (draft() === props.ctx.value.content) {
      props.ctx.cancelEditing();
      return;
    }
    props.ctx.commitEdit({
      ...props.ctx.value,
      content: draft(),
    });
  };

  const cancel = () => {
    if (closed) {
      return;
    }
    closed = true;
    props.ctx.cancelEditing();
  };

  onMount(() => {
    queueMicrotask(() => {
      inputRef?.focus();
      inputRef?.select();
    });
  });

  return (
    <input
      ref={inputRef}
      value={draft()}
      class={cn(props.class, "bg-bg")}
      aria-label="cell input"
      onInput={(event) => {
        setDraft(event.currentTarget.value);
      }}
      onBlur={() => {
        commit();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
          return;
        }

        if (event.key === "Enter" && !event.isComposing) {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
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
    return <CellEditor ctx={ctx} class={styleClass} />;
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
