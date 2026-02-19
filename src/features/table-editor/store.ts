import { createSignal } from "solid-js";
import type {
  Align,
  HorizontalAlign,
  VerticalAlign,
} from "@/domain/typst/alignment";
import type { FigureOption } from "@/domain/typst/figure";
import type { Cell } from "@/domain/typst/table/cell";
import {
  DEFAULT_FORMAT_TABLE_OPTIONS,
  type TableFormattingOptions,
} from "@/domain/typst/table/render-table";
import {
  type CellPosition,
  createEmptyTable,
  insertColumn,
  insertRow,
  isInBounds,
  removeColumn,
  removeRow,
  type Table,
  withCellAlign,
  withCellBold,
  withCellItalic,
  withColumnStroke,
  withRowStroke,
} from "@/domain/typst/table/table";
import { type CellRange, getCellPositions, normalizeRange } from "./cell-range";

interface WrapFigure {
  enabled: boolean;
  figureOptions: FigureOption;
}

interface ExportState {
  lastExportedCode: string | null;
  isStale: boolean;
  showExportModal: boolean;
  copyError: boolean;
}

export interface TableEditorState {
  table: Table;
  wrapFigure: WrapFigure;
  tableRenderingOptions: TableFormattingOptions;
  activeCell: CellPosition | null;
  selection: CellRange | null;
  export: ExportState;
}

const INITIAL_ROWS = 3;
const INITIAL_COLUMNS = 3;

const initialState: TableEditorState = {
  table: createEmptyTable(INITIAL_ROWS, INITIAL_COLUMNS),
  wrapFigure: {
    enabled: false,
    figureOptions: {},
  },
  tableRenderingOptions: { ...DEFAULT_FORMAT_TABLE_OPTIONS },
  selection: null,
  activeCell: null,
  export: {
    lastExportedCode: null,
    isStale: false,
    showExportModal: false,
    copyError: false,
  },
};

const [tableEditorState, setTableEditorState] =
  createSignal<TableEditorState>(initialState);

export const tableEditorStore = tableEditorState;

const applyState = (updater: (state: TableEditorState) => TableEditorState) => {
  setTableEditorState((prev) => updater(prev));
};

export const cellSelector = (
  state: TableEditorState,
  pos: CellPosition,
): Cell | undefined => state.table.rows[pos.row]?.[pos.column];

const markExportAsStale =
  (updater: (state: TableEditorState) => TableEditorState) =>
  (state: TableEditorState): TableEditorState => {
    const newState = updater(state);
    return {
      ...newState,
      export: {
        ...newState.export,
        isStale: newState.export.lastExportedCode !== null,
      },
    };
  };

export const updateTable = (table: Table | ((prev: Table) => Table)) => {
  applyState(
    markExportAsStale((state) => {
      const updatedTable =
        typeof table === "function" ? table(state.table) : table;
      return updateStateWithTable(state, updatedTable);
    }),
  );
};

export const resetTable = () => {
  applyState(
    markExportAsStale((state) => ({
      ...state,
      table: createEmptyTable(INITIAL_ROWS, INITIAL_COLUMNS),
      activeCell: null,
      selection: null,
    })),
  );
};

export type CellStroke = {
  top: boolean;
  bottom: boolean;
  right: boolean;
  left: boolean;
};

export const cellStrokeAt = (
  state: TableEditorState,
  pos: CellPosition,
): CellStroke => {
  const { row, column } = pos;
  const { strokes } = state.table;
  return {
    top: strokes.row[row] ?? false,
    bottom: strokes.row[row + 1] ?? false,
    right: strokes.column[column + 1] ?? false,
    left: strokes.column[column] ?? false,
  };
};

export const wrapFigureEnabledSelector = (state: TableEditorState) =>
  state.wrapFigure.enabled;

export const updateWrapFigureEnabled = (
  enabled: boolean | ((prev: boolean) => boolean),
) => {
  applyState(
    markExportAsStale((state) => {
      const prev = state.wrapFigure.enabled;
      const next = typeof enabled === "function" ? enabled(prev) : enabled;
      return {
        ...state,
        wrapFigure: {
          ...state.wrapFigure,
          enabled: next,
        },
      };
    }),
  );
};

export const wrapFigureOptionsSelector = (state: TableEditorState) =>
  state.wrapFigure.figureOptions;

export const updateWrapFigureOptions = (
  options: FigureOption | ((prev: FigureOption) => FigureOption),
) => {
  applyState(
    markExportAsStale((state) => {
      const prev = state.wrapFigure.figureOptions;
      const next = typeof options === "function" ? options(prev) : options;
      return {
        ...state,
        wrapFigure: {
          ...state.wrapFigure,
          figureOptions: next,
        },
      };
    }),
  );
};

export const updateTableRenderingOptions = (
  options:
    | TableFormattingOptions
    | ((prev: TableFormattingOptions) => TableFormattingOptions),
) => {
  applyState(
    markExportAsStale((state) => {
      const prev = state.tableRenderingOptions;
      const next = typeof options === "function" ? options(prev) : options;
      return {
        ...state,
        tableRenderingOptions: next,
      };
    }),
  );
};

export const setActiveCell = (pos: CellPosition) => {
  applyState((state) => ({ ...state, activeCell: pos }));
};

export const clearActiveCell = () => {
  applyState((state) => ({ ...state, activeCell: null }));
};

export const selectCellRange = (range: CellRange) => {
  applyState((state) => {
    const nextRange = normalizeRange(state.table, range);
    return {
      ...state,
      selection: nextRange,
    };
  });
};

export const clearSelection = () => {
  applyState((state) => {
    if (state.selection === null) {
      return state;
    }
    return {
      ...state,
      selection: null,
    };
  });
};

type SelectionUpdater = (table: Table, selection: CellRange) => Table;

const runSelectionUpdate = (updater: SelectionUpdater) => {
  applyState(
    markExportAsStale((state) => {
      if (!state.selection) {
        return state;
      }

      const nextTable = updater(state.table, state.selection);
      if (nextTable === state.table) {
        return state;
      }

      const nextSelection = normalizeRange(nextTable, state.selection);
      const nextActiveCell =
        state.activeCell && isInBounds(nextTable, state.activeCell)
          ? state.activeCell
          : (nextSelection?.start ?? null);

      return {
        ...state,
        table: nextTable,
        selection: nextSelection,
        activeCell: nextActiveCell,
      };
    }),
  );
};

const areCellPositionsEqual = (
  a: CellPosition | null,
  b: CellPosition | null,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.row === b.row && a.column === b.column;
};

const areRangesEqual = (a: CellRange | null, b: CellRange | null): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.start.row === b.start.row &&
    a.start.column === b.start.column &&
    a.end.row === b.end.row &&
    a.end.column === b.end.column
  );
};

const updateStateWithTable = (
  state: TableEditorState,
  table: Table,
): TableEditorState => {
  const nextSelection = state.selection
    ? normalizeRange(table, state.selection)
    : null;
  const nextActiveCell =
    state.activeCell && isInBounds(table, state.activeCell)
      ? state.activeCell
      : (nextSelection?.start ?? null);

  const tableChanged = table !== state.table;
  const selectionChanged = !areRangesEqual(state.selection, nextSelection);
  const activeCellChanged = !areCellPositionsEqual(
    state.activeCell,
    nextActiveCell,
  );

  if (!tableChanged && !selectionChanged && !activeCellChanged) {
    return state;
  }

  return {
    ...state,
    table,
    selection: nextSelection,
    activeCell: nextActiveCell,
  };
};

const reduceSelectionCells = (
  table: Table,
  selection: CellRange,
  reducer: (current: Table, pos: CellPosition) => Table,
) => {
  const positions = getCellPositions(selection);
  return positions.reduce((current, pos) => reducer(current, pos), table);
};

const applyHorizontalAlign = (
  prev: Align | undefined,
  align: HorizontalAlign | null,
): Align | undefined => {
  if (align === null) {
    if (!prev) {
      return undefined;
    }
    if (prev.vertical !== undefined) {
      return { vertical: prev.vertical };
    }
    return undefined;
  }

  return {
    ...(prev ?? {}),
    horizontal: align,
  };
};

const applyVerticalAlign = (
  prev: Align | undefined,
  align: VerticalAlign | null,
): Align | undefined => {
  if (align === null) {
    if (!prev) {
      return undefined;
    }
    if (prev.horizontal !== undefined) {
      return { horizontal: prev.horizontal };
    }
    return undefined;
  }

  return {
    ...(prev ?? {}),
    vertical: align,
  };
};

const applyRowStrokeRange = (
  table: Table,
  start: number,
  endInclusive: number,
  value: boolean,
) => {
  let next = table;
  for (let index = start; index <= endInclusive; index++) {
    next = withRowStroke(next, index, value);
  }
  return next;
};

const applyColumnStrokeRange = (
  table: Table,
  start: number,
  endInclusive: number,
  value: boolean,
) => {
  let next = table;
  for (let index = start; index <= endInclusive; index++) {
    next = withColumnStroke(next, index, value);
  }
  return next;
};

export const setSelectionBold = (bold: boolean) => {
  runSelectionUpdate((table, selection) =>
    reduceSelectionCells(table, selection, (current, pos) =>
      withCellBold(current, pos, bold),
    ),
  );
};

export const setSelectionItalic = (italic: boolean) => {
  runSelectionUpdate((table, selection) =>
    reduceSelectionCells(table, selection, (current, pos) =>
      withCellItalic(current, pos, italic),
    ),
  );
};

export const setSelectionHorizontalAlign = (align: HorizontalAlign | null) => {
  runSelectionUpdate((table, selection) =>
    reduceSelectionCells(table, selection, (current, pos) =>
      withCellAlign(current, pos, (prev) => applyHorizontalAlign(prev, align)),
    ),
  );
};

export const setSelectionVerticalAlign = (align: VerticalAlign | null) => {
  runSelectionUpdate((table, selection) =>
    reduceSelectionCells(table, selection, (current, pos) =>
      withCellAlign(current, pos, (prev) => applyVerticalAlign(prev, align)),
    ),
  );
};

export const setSelectionBorderTop = () => {
  runSelectionUpdate((table, selection) =>
    withRowStroke(table, selection.start.row, true),
  );
};

export const setSelectionBorderBottom = () => {
  runSelectionUpdate((table, selection) =>
    withRowStroke(table, selection.end.row + 1, true),
  );
};

export const setSelectionBorderLeft = () => {
  runSelectionUpdate((table, selection) =>
    withColumnStroke(table, selection.start.column, true),
  );
};

export const setSelectionBorderRight = () => {
  runSelectionUpdate((table, selection) =>
    withColumnStroke(table, selection.end.column + 1, true),
  );
};

export const setSelectionBorderAll = () => {
  runSelectionUpdate((table, selection) => {
    const { start, end } = selection;
    let next = applyRowStrokeRange(table, start.row, end.row + 1, true);
    next = applyColumnStrokeRange(next, start.column, end.column + 1, true);
    return next;
  });
};

export const clearSelectionBorders = () => {
  runSelectionUpdate((table, selection) => {
    const { start, end } = selection;
    let next = applyRowStrokeRange(table, start.row, end.row + 1, false);
    next = applyColumnStrokeRange(next, start.column, end.column + 1, false);
    return next;
  });
};

export const insertRowAboveSelection = () => {
  applyState(
    markExportAsStale((state) => {
      const targetRow =
        state.selection !== null ? state.selection.start.row : 0;
      const nextTable = insertRow(state.table, targetRow);
      return updateStateWithTable(state, nextTable);
    }),
  );
};

export const insertRowBelowSelection = () => {
  applyState(
    markExportAsStale((state) => {
      const targetRow =
        state.selection !== null
          ? state.selection.end.row + 1
          : state.table.rows.length;
      const nextTable = insertRow(state.table, targetRow);
      return updateStateWithTable(state, nextTable);
    }),
  );
};

export const removeSelectedRows = () => {
  runSelectionUpdate((table, selection) => {
    let next = table;
    for (let row = selection.end.row; row >= selection.start.row; row--) {
      next = removeRow(next, row);
    }
    return next;
  });
};

export const insertColumnLeftOfSelection = () => {
  applyState(
    markExportAsStale((state) => {
      const targetColumn =
        state.selection !== null ? state.selection.start.column : 0;
      const nextTable = insertColumn(state.table, targetColumn);
      return updateStateWithTable(state, nextTable);
    }),
  );
};

export const insertColumnRightOfSelection = () => {
  applyState(
    markExportAsStale((state) => {
      const targetColumn =
        state.selection !== null
          ? state.selection.end.column + 1
          : state.table.columnSpecs.length;
      const nextTable = insertColumn(state.table, targetColumn);
      return updateStateWithTable(state, nextTable);
    }),
  );
};

export const removeSelectedColumns = () => {
  runSelectionUpdate((table, selection) => {
    let next = table;
    for (
      let column = selection.end.column;
      column >= selection.start.column;
      column--
    ) {
      next = removeColumn(next, column);
    }
    return next;
  });
};

export const setExportModal = (open: boolean) => {
  applyState((state) => ({
    ...state,
    export: {
      ...state.export,
      showExportModal: open,
      copyError: open ? state.export.copyError : false,
    },
  }));
};

export const updateExportedCode = (code: string) => {
  applyState((state) => ({
    ...state,
    export: {
      ...state.export,
      lastExportedCode: code,
      isStale: false,
    },
  }));
};

export const setCopyError = (hasError: boolean) => {
  applyState((state) => ({
    ...state,
    export: {
      ...state.export,
      copyError: hasError,
    },
  }));
};

export const exportStateSelector = (state: TableEditorState) => state.export;
