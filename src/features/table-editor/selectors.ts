import type { TableEditorState } from "./store";

export const tableSelector = (state: TableEditorState) => state.table;

export const tableRenderingOptionsSelector = (state: TableEditorState) =>
  state.tableRenderingOptions;
