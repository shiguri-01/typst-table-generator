import { describe, expect, it } from "vitest";

import {
  createEmptyTable,
  createTableModel,
  getTableDimensions,
  insertColumn,
  insertRow,
  normalizeTableModel,
  removeColumn,
  removeRow,
  setCaption,
  setHeaderRows,
  setStrokes,
  updateCell,
  updateColumnSpec,
  updateColumnStroke,
  updateRowStroke,
} from "./model";

describe("table model helpers", () => {
  it("creates an empty normalized table", () => {
    const model = createEmptyTable(2, 3);

    expect(model.rows).toHaveLength(2);
    expect(model.rows[0]).toHaveLength(3);
    expect(model.rows[0][0]).toEqual({ text: "" });
    expect(model.headerRows).toBeUndefined();
    expect(model.caption).toBeUndefined();
    expect(model.columnSpecs).toBeUndefined();
    expect(model.strokes).toBeUndefined();
  });

  it("normalizes ragged rows and clamps header rows", () => {
    const model = createTableModel({
      rows: [
        [{ text: "A" }, { text: "B" }],
        [{ text: "1" }],
      ],
      headerRows: 5,
      columnSpecs: [{ width: "auto" }, { width: 24 }, { width: 12 }],
    });

    expect(model.rows[1][1]).toEqual({ text: "" });
    expect(model.headerRows).toBe(2);
    expect(model.columnSpecs).toEqual([{ width: "auto" }, { width: 24 }]);
  });

  it("updates a cell without mutating the original model", () => {
    const model = createEmptyTable(1, 2);
    const updated = updateCell(model, { rowIndex: 0, columnIndex: 1 }, (cell) => ({
      ...cell,
      text: "value",
      bold: true,
    }));

    expect(updated.rows[0][1]).toEqual({ text: "value", bold: true });
    expect(model.rows[0][1]).toEqual({ text: "" });
  });

  it("inserts and removes rows while maintaining invariants", () => {
    const model = createEmptyTable(2, 2, { headerRows: 2 });
    const withRow = insertRow(model, 1, [{ text: "X" }]);

    expect(getTableDimensions(withRow)).toEqual({ rowCount: 3, columnCount: 2 });
    expect(withRow.rows[1][0]).toEqual({ text: "X" });

    const withoutRow = removeRow(withRow, 2);
    expect(getTableDimensions(withoutRow)).toEqual({ rowCount: 2, columnCount: 2 });
    expect(withoutRow.headerRows).toBe(2);
  });

  it("inserts and removes columns while syncing column specs and strokes", () => {
    const model = createTableModel({
      rows: [
        [{ text: "A" }, { text: "B" }],
        [{ text: "C" }, { text: "D" }],
      ],
      columnSpecs: [{ align: "center" }],
      strokes: {
        rows: [{ bottom: 0.5 }, { bottom: 0.5 }],
        columns: [{ right: 0.5 }],
      },
    });

    const withColumn = insertColumn(model, 1);
    expect(getTableDimensions(withColumn)).toEqual({ rowCount: 2, columnCount: 3 });
    expect(withColumn.rows[0][1]).toEqual({ text: "" });
    expect(withColumn.columnSpecs?.length).toBe(3);
    expect(withColumn.strokes?.columns).toHaveLength(3);

    const withoutColumn = removeColumn(withColumn, 0);
    expect(getTableDimensions(withoutColumn)).toEqual({
      rowCount: 2,
      columnCount: 2,
    });
    expect(withoutColumn.columnSpecs?.length).toBe(2);
    expect(withoutColumn.strokes?.columns).toHaveLength(2);
  });

  it("clamps header rows and clears empty captions", () => {
    const model = createEmptyTable(2, 2);
    const cappedHeader = setHeaderRows(model, 5);
    expect(cappedHeader.headerRows).toBe(2);

    const withCaption = setCaption(cappedHeader, "");
    expect(withCaption.caption).toBeUndefined();
  });

  it("manages strokes through dedicated helpers", () => {
    const model = createEmptyTable(2, 2);
    const withRowStroke = updateRowStroke(model, 0, { bottom: 0.6 });
    expect(withRowStroke.strokes?.rows?.[0]).toEqual({ bottom: 0.6 });

    const withColumnStroke = updateColumnStroke(withRowStroke, 1, { right: "none" });
    expect(withColumnStroke.strokes?.columns?.[1]).toEqual({ right: "none" });

    const cleared = setStrokes(withColumnStroke, undefined);
    expect(cleared.strokes).toBeUndefined();
  });

  it("normalizes mismatched stroke arrays during explicit normalization", () => {
    const model = normalizeTableModel({
      rows: [
        [{ text: "A" }],
        [{ text: "B" }],
      ],
      strokes: {
        rows: [{ bottom: 0.4 }],
        columns: [{ right: 0.3 }, { right: 0.2 }, { right: 0 }],
      },
    });

    expect(model.strokes?.rows).toHaveLength(2);
    expect(model.strokes?.columns).toHaveLength(1);
    expect(model.strokes?.columns?.[0]).toEqual({ right: 0.3 });
  });

  it("updates column specs with normalization", () => {
    const model = createEmptyTable(1, 2);
    const updated = updateColumnSpec(model, 1, { width: 48, align: "right" });
    expect(updated.columnSpecs?.[1]).toEqual({ width: 48, align: "right" });
  });
});
