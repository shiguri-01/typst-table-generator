import { Derived, Store } from "@tanstack/react-store";
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
  type Table,
} from "@/domain/typst/table/table";
import { type CellRange, normalizeRange } from "./selections";

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
