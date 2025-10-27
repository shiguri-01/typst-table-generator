import { isDraft, original } from "immer";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { NamedSet } from "zustand/middleware/devtools";
import { immer } from "zustand/middleware/immer";
import type {
  Cell,
  ColumnSpec,
  ColumnStroke,
  RowStroke,
  TableCellPosition,
  TableModel,
  TableStrokes,
} from "@/lib/table";
import {
  createEmptyTable,
  getTableDimensions,
  insertColumn,
  insertRow,
  patchCell,
  removeColumn,
  removeRow,
  setCaption as setCaptionValue,
  setHeaderRows as setHeaderRowsValue,
  setStrokes,
  updateColumnSpec as updateColumnSpecValue,
  updateColumnStroke,
  updateRowStroke,
} from "@/lib/table";
import {
  applyStylePreset,
  STYLE_PRESETS,
  type StylePresetId,
  type StylePresetResult,
  type TableArguments,
} from "./presets";

export interface TableSelectionRange {
  start: TableCellPosition;
  end: TableCellPosition;
}

export interface TableSelection {
  active: TableCellPosition | null;
  range: TableSelectionRange | null;
}

interface TableSnapshot {
  model: TableModel;
  tableArgs: TableArguments;
  presetId: StylePresetId;
}

interface TableHistory {
  past: TableSnapshot[];
  future: TableSnapshot[];
}

export interface TableEditorActions {
  load(model: TableModel, options?: { presetId?: StylePresetId }): void;
  setSelection(selection: TableSelection): void;
  editCell(position: TableCellPosition, patch: Partial<Cell>): void;
  editCells(range: TableSelectionRange | null, patch: Partial<Cell>): void;
  insertRow(at: number): void;
  removeRows(indexes: number[]): void;
  insertColumn(at: number): void;
  removeColumns(indexes: number[]): void;
  setHeaderRows(next: number): void;
  setCaption(text: string): void;
  updateColumnSpec(columnIndex: number, patch: Partial<ColumnSpec>): void;
  updateStroke(
    kind: "row" | "column",
    index: number,
    patch: RowStroke | ColumnStroke,
  ): void;
  applyPreset(id: StylePresetId): void;
  setModal(name: "export" | "import", open: boolean): void;
  setTableName(name: string): void;
  setClipboardPreview(preview: string | null): void;
  undo(): void;
  redo(): void;
  markClean(): void;
}

export interface TableEditorState {
  model: TableModel;
  tableArgs: TableArguments;
  presetId: StylePresetId;
  tableName: string;
  selection: TableSelection;
  clipboardPreview: string | null;
  isDirty: boolean;
  modals: { export: boolean; import: boolean };
  history: TableHistory;
  actions: TableEditorActions;
}

const HISTORY_LIMIT = 50;
const INITIAL_TABLE_NAME = "Untitled table";

const initialModel = createEmptyTable(3, 3, { headerRows: 1 });
const initialPresetId: StylePresetId = "default";
const initialPresetResult = applyStylePreset(initialModel, initialPresetId);
const initialStateModel = mergePresetStrokes(initialModel, initialPresetResult);

const initialState: Omit<TableEditorState, "actions"> = {
  model: initialStateModel,
  tableArgs: cloneTableArgs(initialPresetResult.tableArgs),
  presetId: initialPresetId,
  tableName: INITIAL_TABLE_NAME,
  selection: { active: null, range: null },
  clipboardPreview: null,
  isDirty: false,
  modals: { export: false, import: false },
  history: { past: [], future: [] },
};

function normalizeRange(range: TableSelectionRange): TableSelectionRange {
  const startRow = Math.min(range.start.rowIndex, range.end.rowIndex);
  const endRow = Math.max(range.start.rowIndex, range.end.rowIndex);
  const startColumn = Math.min(range.start.columnIndex, range.end.columnIndex);
  const endColumn = Math.max(range.start.columnIndex, range.end.columnIndex);

  return {
    start: { rowIndex: startRow, columnIndex: startColumn },
    end: { rowIndex: endRow, columnIndex: endColumn },
  };
}

function forEachCell(
  range: TableSelectionRange,
  handler: (position: TableCellPosition) => void,
): void {
  const normalized = normalizeRange(range);
  for (
    let row = normalized.start.rowIndex;
    row <= normalized.end.rowIndex;
    row += 1
  ) {
    for (
      let column = normalized.start.columnIndex;
      column <= normalized.end.columnIndex;
      column += 1
    ) {
      handler({ rowIndex: row, columnIndex: column });
    }
  }
}

function mergePresetStrokes(
  model: TableModel,
  preset: StylePresetResult,
): TableModel {
  if (!preset.strokes) {
    return model;
  }

  const { rowCount, columnCount } = getTableDimensions(model);
  const rows = ensureRowStrokes(model.strokes?.rows, rowCount);
  const columns = ensureColumnStrokes(model.strokes?.columns, columnCount);

  preset.strokes.rows?.forEach((stroke, index) => {
    if (index >= 0 && index < rows.length) {
      rows[index] = {
        ...rows[index],
        ...stroke,
      };
    }
  });

  preset.strokes.columns?.forEach((stroke, index) => {
    if (index >= 0 && index < columns.length) {
      columns[index] = {
        ...columns[index],
        ...stroke,
      };
    }
  });

  return setStrokes(model, {
    rows,
    columns,
  });
}

function ensureRowStrokes(
  source: TableStrokes["rows"],
  length: number,
): RowStroke[] {
  return Array.from({ length }, (_, index) => ({
    ...(source?.[index] ?? {}),
  }));
}

function ensureColumnStrokes(
  source: TableStrokes["columns"],
  length: number,
): ColumnStroke[] {
  return Array.from({ length }, (_, index) => ({
    ...(source?.[index] ?? {}),
  }));
}

function cloneTableArgs(args?: TableArguments): TableArguments {
  if (!args) {
    return {};
  }
  const source = isDraft(args) ? (original(args) ?? args) : args;
  if (typeof globalThis.structuredClone === "function") {
    try {
      return globalThis.structuredClone(source);
    } catch (_error) {
      // structuredClone can throw for unsupported values; fall back to JSON clone.
    }
  }
  return JSON.parse(JSON.stringify(source)) as TableArguments;
}

function captureSnapshot(state: TableEditorState): TableSnapshot {
  return {
    model: state.model,
    tableArgs: cloneTableArgs(state.tableArgs),
    presetId: state.presetId,
  };
}

function pushHistory(state: TableEditorState): void {
  state.history.past.push(captureSnapshot(state));
  if (state.history.past.length > HISTORY_LIMIT) {
    state.history.past.shift();
  }
  state.history.future = [];
}

function restoreSnapshot(
  state: TableEditorState,
  snapshot: TableSnapshot,
): void {
  state.model = snapshot.model;
  state.tableArgs = cloneTableArgs(snapshot.tableArgs);
  state.presetId = snapshot.presetId;
  state.isDirty = true;
}

export const useTableEditorStore = create<TableEditorState>()(
  subscribeWithSelector(
    devtools(
      immer<TableEditorState>((set, get) => {
        const setState = set as NamedSet<TableEditorState>;
        type DevtoolsAction = Parameters<NamedSet<TableEditorState>>[2];
        const apply = (
          recipe: (state: TableEditorState) => void,
          action?: DevtoolsAction,
        ) => {
          setState(
            (state) => {
              recipe(state);
              return state;
            },
            false,
            action,
          );
        };
        return {
          ...initialState,
          actions: {
            load(model, options) {
              const presetId = options?.presetId ?? get().presetId;
              const presetResult = applyStylePreset(model, presetId);
              apply(
                (state) => {
                  state.model = mergePresetStrokes(model, presetResult);
                  state.tableArgs = cloneTableArgs(presetResult.tableArgs);
                  state.presetId = presetId;
                  state.isDirty = false;
                  state.history = { past: [], future: [] };
                },
                { type: "table-editor/load" },
              );
            },
            setSelection(selection) {
              apply(
                (state) => {
                  state.selection = {
                    active: selection.active,
                    range: selection.range
                      ? normalizeRange(selection.range)
                      : null,
                  };
                },
                { type: "table-editor/setSelection" },
              );
            },
            editCell(position, patch) {
              apply(
                (state) => {
                  pushHistory(state);
                  state.model = patchCell(state.model, position, patch);
                  state.isDirty = true;
                },
                { type: "table-editor/editCell" },
              );
            },
            editCells(range, patch) {
              if (!range) {
                return;
              }
              apply(
                (state) => {
                  pushHistory(state);
                  const positions: TableCellPosition[] = [];
                  forEachCell(range, (position) => {
                    positions.push(position);
                  });
                  let nextModel = state.model;
                  positions.forEach((position) => {
                    nextModel = patchCell(nextModel, position, patch);
                  });
                  state.model = nextModel;
                  state.isDirty = true;
                },
                { type: "table-editor/editCells" },
              );
            },
            insertRow(at) {
              apply(
                (state) => {
                  pushHistory(state);
                  state.model = insertRow(state.model, at);
                  state.isDirty = true;
                },
                { type: "table-editor/insertRow" },
              );
            },
            removeRows(indexes) {
              const sorted = Array.from(new Set(indexes)).sort((a, b) => a - b);
              if (sorted.length === 0) {
                return;
              }
              apply(
                (state) => {
                  pushHistory(state);
                  let nextModel = state.model;
                  for (let index = sorted.length - 1; index >= 0; index -= 1) {
                    nextModel = removeRow(nextModel, sorted[index]);
                  }
                  state.model = nextModel;
                  state.isDirty = true;
                },
                { type: "table-editor/removeRows" },
              );
            },
            insertColumn(at) {
              apply(
                (state) => {
                  pushHistory(state);
                  state.model = insertColumn(state.model, at);
                  state.isDirty = true;
                },
                { type: "table-editor/insertColumn" },
              );
            },
            removeColumns(indexes) {
              const sorted = Array.from(new Set(indexes)).sort((a, b) => a - b);
              if (sorted.length === 0) {
                return;
              }
              apply(
                (state) => {
                  pushHistory(state);
                  let nextModel = state.model;
                  for (let index = sorted.length - 1; index >= 0; index -= 1) {
                    nextModel = removeColumn(nextModel, sorted[index]);
                  }
                  state.model = nextModel;
                  state.isDirty = true;
                },
                { type: "table-editor/removeColumns" },
              );
            },
            setHeaderRows(next) {
              apply(
                (state) => {
                  pushHistory(state);
                  state.model = setHeaderRowsValue(state.model, next);
                  state.isDirty = true;
                },
                { type: "table-editor/setHeaderRows" },
              );
            },
            setCaption(text) {
              apply(
                (state) => {
                  pushHistory(state);
                  state.model = setCaptionValue(state.model, text);
                  state.isDirty = true;
                },
                { type: "table-editor/setCaption" },
              );
            },
            updateColumnSpec(columnIndex, patch) {
              apply(
                (state) => {
                  pushHistory(state);
                  state.model = updateColumnSpecValue(
                    state.model,
                    columnIndex,
                    patch,
                  );
                  state.isDirty = true;
                },
                { type: "table-editor/updateColumnSpec" },
              );
            },
            updateStroke(kind, index, patch) {
              apply(
                (state) => {
                  pushHistory(state);
                  if (kind === "row") {
                    state.model = updateRowStroke(
                      state.model,
                      index,
                      patch as RowStroke,
                    );
                  } else {
                    state.model = updateColumnStroke(
                      state.model,
                      index,
                      patch as ColumnStroke,
                    );
                  }
                  state.isDirty = true;
                },
                { type: "table-editor/updateStroke" },
              );
            },
            applyPreset(id) {
              if (!STYLE_PRESETS[id]) {
                return;
              }
              apply(
                (state) => {
                  pushHistory(state);
                  const result = applyStylePreset(state.model, id);
                  state.model = mergePresetStrokes(state.model, result);
                  state.tableArgs = cloneTableArgs(result.tableArgs);
                  state.presetId = id;
                  state.isDirty = true;
                },
                { type: "table-editor/applyPreset" },
              );
            },
            setModal(name, open) {
              apply(
                (state) => {
                  state.modals[name] = open;
                },
                { type: "table-editor/setModal" },
              );
            },
            setTableName(name) {
              apply(
                (state) => {
                  state.tableName = name;
                  state.isDirty = true;
                },
                { type: "table-editor/setTableName" },
              );
            },
            setClipboardPreview(preview) {
              apply(
                (state) => {
                  state.clipboardPreview = preview;
                },
                { type: "table-editor/setClipboardPreview" },
              );
            },
            undo() {
              apply(
                (state) => {
                  const previous = state.history.past.pop();
                  if (!previous) {
                    return;
                  }
                  state.history.future.push(captureSnapshot(state));
                  restoreSnapshot(state, previous);
                },
                { type: "table-editor/undo" },
              );
            },
            redo() {
              apply(
                (state) => {
                  const next = state.history.future.pop();
                  if (!next) {
                    return;
                  }
                  state.history.past.push(captureSnapshot(state));
                  restoreSnapshot(state, next);
                },
                { type: "table-editor/redo" },
              );
            },
            markClean() {
              apply(
                (state) => {
                  state.isDirty = false;
                },
                { type: "table-editor/markClean" },
              );
            },
          },
        };
      }),
      {
        enabled: import.meta.env.DEV,
        name: "table-editor",
      },
    ),
  ),
);
