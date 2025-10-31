import { Derived, Store } from "@tanstack/react-store";
import type {
  Align,
  HorizontalAlign,
  VerticalAlign,
} from "@/domain/typst/alignment";
import type { FigureOption } from "@/domain/typst/figure";
import type { Cell } from "@/domain/typst/table/cell";
import type { ColumnSpec } from "@/domain/typst/table/column";
import {
  DEFAULT_FORMAT_TABLE_OPTIONS,
  type TableFormattingOptions,
} from "@/domain/typst/table/render-table";
import {
  type CellPosition,
  createEmptyTable,
  insertColumn,
  insertRow,
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

export interface TableEditorState {
  table: Table;
  wrapFigure: WrapFigure;
  tableRenderingOptions: TableFormattingOptions;

  activeCell: CellPosition | null;
  selection: CellRange | null;
}

const INITIAL_ROWS = 3;
const INITIAL_COLUMNS = 3;

export const tableEditorStore = new Store<TableEditorState>({
  table: createEmptyTable(INITIAL_ROWS, INITIAL_COLUMNS),
  wrapFigure: {
    enabled: false,
    figureOptions: {},
  },
  tableRenderingOptions: { ...DEFAULT_FORMAT_TABLE_OPTIONS },
  selection: null,
  activeCell: null,
});

export const cellSelector =
  (pos: CellPosition) =>
  (state: TableEditorState): Cell | undefined =>
    state.table.rows[pos.row]?.[pos.column];

export const columnSpecSelector =
  (columnIndex: number) =>
  (state: TableEditorState): ColumnSpec | undefined =>
    state.table.columnSpecs[columnIndex];

export const updateTable = (table: Table | ((prev: Table) => Table)) => {
  tableEditorStore.setState((state) => {
    const updatedTable =
      typeof table === "function" ? table(state.table) : table;
    return {
      ...state,
      table: updatedTable,
    };
  });
};

export const resetTable = () => {
  tableEditorStore.setState((state) => ({
    ...state,
    table: createEmptyTable(INITIAL_ROWS, INITIAL_COLUMNS),
    activeCell: null,
    selection: null,
  }));
};

export type CellStroke = {
  top: boolean;
  bottom: boolean;
  right: boolean;
  left: boolean;
};

export const cellStrokes = new Derived<CellStroke[][]>({
  deps: [tableEditorStore],
  fn: () => {
    const table = tableEditorStore.state.table;
    const { row: rowStrokes, column: colStrokes } = table.strokes;
    const strokes: CellStroke[][] = table.rows.map((row, rowIdx) =>
      row.map((_, colIdx) => ({
        top: rowStrokes[rowIdx] ?? false,
        bottom: rowStrokes[rowIdx + 1] ?? false,
        right: colStrokes[colIdx + 1] ?? false,
        left: colStrokes[colIdx] ?? false,
      })),
    );

    return strokes;
  },
});

export const cellStrokeSelector =
  (pos: CellPosition) =>
  (state: CellStroke[][]): CellStroke =>
    state[pos.row]?.[pos.column] ?? {
      top: false,
      bottom: false,
      right: false,
      left: false,
    };

export type DatasheetGridRow = Record<string, Cell>;

// TODO: 列の追加、消去でkeyが保持されるようにする
/**
 * GridUIで使う用
 */
export const tableData = new Derived({
  deps: [tableEditorStore],
  fn: () => {
    const table = tableEditorStore.state.table;
    const columnKeys = table.columnSpecs.map((_, index) => `col-${index}`);
    const rowData: Array<DatasheetGridRow> = table.rows.map((row) => {
      const rowRecord: DatasheetGridRow = {};
      row.forEach((cell, index) => {
        rowRecord[`col-${index}`] = cell;
      });
      return rowRecord;
    });

    return { columns: columnKeys, data: rowData };
  },
});

export const wrapFigureEnabledSelector = (state: TableEditorState) =>
  state.wrapFigure.enabled;

export const updateWrapFigureEnabled = (
  enabled: boolean | ((prev: boolean) => boolean),
) => {
  tableEditorStore.setState((state) => {
    const prev = state.wrapFigure.enabled;
    const newEnabled = typeof enabled === "function" ? enabled(prev) : enabled;
    return {
      ...state,
      wrapFigure: {
        ...state.wrapFigure,
        enabled: newEnabled,
      },
    };
  });
};

export const wrapFigureOptionsSelector = (state: TableEditorState) =>
  state.wrapFigure.figureOptions;

export const updateWrapFigureOptions = (
  options: FigureOption | ((prev: FigureOption) => FigureOption),
) => {
  tableEditorStore.setState((state) => {
    const prev = state.wrapFigure.figureOptions;
    const newOptions = typeof options === "function" ? options(prev) : options;
    return {
      ...state,
      wrapFigure: {
        ...state.wrapFigure,
        figureOptions: newOptions,
      },
    };
  });
};

export const updateTableRenderingOptions = (
  options:
    | TableFormattingOptions
    | ((prev: TableFormattingOptions) => TableFormattingOptions),
) => {
  tableEditorStore.setState((state) => {
    const prev = state.tableRenderingOptions;
    const newOptions = typeof options === "function" ? options(prev) : options;
    return {
      ...state,
      tableRenderingOptions: newOptions,
    };
  });
};

export const setActiveCell = (pos: CellPosition) => {
  tableEditorStore.setState((state) => ({
    ...state,
    activeCell: pos,
  }));
};

export const clearActiveCell = () => {
  tableEditorStore.setState((state) => ({
    ...state,
    activeCell: null,
  }));
};

export const selectCellRange = (range: CellRange) => {
  tableEditorStore.setState((state) => {
    const table = state.table;
    const newRange = normalizeRange(table, range);
    if (newRange) {
      return {
        ...state,
        selection: newRange,
      };
    } else {
      // 範囲外が指定された場合はクリア
      return { ...state, selection: null };
    }
  });
};

export const clearSelection = () => {
  tableEditorStore.setState((state) => {
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
  tableEditorStore.setState((state) => {
    if (!state.selection) {
      return state;
    }

    const nextTable = updater(state.table, state.selection);
    if (nextTable === state.table) {
      return state;
    }

    const nextSelection = normalizeRange(nextTable, state.selection);
    return {
      ...state,
      table: nextTable,
      selection: nextSelection,
    };
  });
};

const updateStateWithTable = (
  state: TableEditorState,
  table: Table,
): TableEditorState => ({
  ...state,
  table,
  selection: state.selection ? normalizeRange(table, state.selection) : null,
});

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
      // 縦方向の指定だけ残す
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
      // 横方向の指定だけ残す
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
  tableEditorStore.setState((state) => {
    const targetRow = state.selection !== null ? state.selection.start.row : 0;
    const nextTable = insertRow(state.table, targetRow);
    return updateStateWithTable(state, nextTable);
  });
};

export const insertRowBelowSelection = () => {
  tableEditorStore.setState((state) => {
    const targetRow =
      state.selection !== null
        ? state.selection.end.row + 1
        : state.table.rows.length;
    const nextTable = insertRow(state.table, targetRow);
    return updateStateWithTable(state, nextTable);
  });
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
  tableEditorStore.setState((state) => {
    const targetColumn =
      state.selection !== null ? state.selection.start.column : 0;
    const nextTable = insertColumn(state.table, targetColumn);
    return updateStateWithTable(state, nextTable);
  });
};

export const insertColumnRightOfSelection = () => {
  tableEditorStore.setState((state) => {
    const targetColumn =
      state.selection !== null
        ? state.selection.end.column + 1
        : state.table.columnSpecs.length;
    const nextTable = insertColumn(state.table, targetColumn);
    return updateStateWithTable(state, nextTable);
  });
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
