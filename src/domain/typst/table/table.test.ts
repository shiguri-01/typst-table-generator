import { describe, expect, it } from "vitest";

import type { Cell } from "./cell";
import {
  createEmptyTable,
  insertColumn,
  insertRow,
  isInBounds,
  removeColumn,
  removeRow,
  setCellAlign,
  setCellBold,
  setCellContent,
  setCellItalic,
  type Table,
} from "./table";

const makeTable = (rows: Cell[][], overrides: Partial<Table> = {}): Table => {
  const base = createEmptyTable(rows.length, rows[0]?.length ?? 0);

  return {
    ...base,
    ...overrides,
    rows,
    columnSpecs: overrides.columnSpecs ?? base.columnSpecs,
    strokes: overrides.strokes ?? base.strokes,
  };
};

describe("table helpers", () => {
  it("creates an empty table with default specs and strokes", () => {
    const table = createEmptyTable(2, 3);

    expect(table.columnSpecs).toHaveLength(3);
    table.columnSpecs.forEach((spec) => {
      expect(spec).toEqual({});
    });

    expect(table.rows).toHaveLength(2);
    table.rows.forEach((row) => {
      expect(row).toHaveLength(3);
      row.forEach((cell) => {
        expect(cell).toEqual({ content: "" });
      });
    });

    expect(table.strokes.row).toEqual([false, false, false]);
    expect(table.strokes.column).toEqual([false, false, false, false]);
  });

  it("inserts a row while normalizing length, shifting strokes, and bumping header rows", () => {
    const table = makeTable(
      [
        [{ content: "r0c0" }, { content: "r0c1" }],
        [{ content: "r1c0" }, { content: "r1c1" }],
      ],
      {
        headerRows: 1,
        strokes: {
          row: [true, false, true],
          column: [false, true, false],
        },
      },
    );

    const inserted = insertRow(table, 0, [{ content: "new" }]);

    expect(inserted.rows).toHaveLength(3);
    expect(inserted.rows[0]).toEqual([{ content: "new" }, { content: "" }]);
    expect(inserted.rows[1]).toEqual(table.rows[0]);
    expect(inserted.headerRows).toBe(2);
    expect(inserted.strokes.row).toEqual([false, true, false, true]);
  });

  it("removes a row, reindexes strokes, and decrements header rows when needed", () => {
    const rows: Cell[][] = [
      [{ content: "r0" }],
      [{ content: "r1" }],
      [{ content: "r2" }],
    ];
    const table = makeTable(rows, {
      headerRows: 2,
      strokes: {
        row: [true, false, true, false],
        column: [false, false],
      },
    });

    const updated = removeRow(table, 0);

    expect(updated.rows).toHaveLength(2);
    expect(updated.rows[0]).toEqual([{ content: "r1" }]);
    expect(updated.headerRows).toBe(1);
    expect(updated.strokes.row).toEqual([false, true, false]);
  });

  it("returns the original table when attempting to remove a row out of range", () => {
    const table = createEmptyTable(1, 1);

    const unchanged = removeRow(table, 5);

    expect(unchanged).toBe(table);
  });

  it("inserts a column with provided spec and cells, normalizing column height", () => {
    const table = makeTable(
      [
        [{ content: "r0c0" }, { content: "r0c1" }],
        [{ content: "r1c0" }, { content: "r1c1" }],
      ],
      {
        columnSpecs: [
          { align: { horizontal: "left" } },
          { align: { horizontal: "right" } },
        ],
        strokes: {
          row: [false, false, false],
          column: [true, false, true],
        },
      },
    );

    const inserted = insertColumn(table, 1, {
      spec: { align: { horizontal: "center" } },
      cells: [{ content: "new", bold: true }],
    });

    expect(inserted.columnSpecs).toHaveLength(3);
    expect(inserted.columnSpecs[1]).toEqual({
      align: { horizontal: "center" },
    });
    expect(inserted.rows[0][1]).toEqual({ content: "new", bold: true });
    expect(inserted.rows[1][1]).toEqual({ content: "" });
    expect(inserted.strokes.column).toEqual([true, true, false, true]);
  });

  it("removes a column and shifts remaining data and strokes", () => {
    const table = makeTable(
      [
        [{ content: "a" }, { content: "b" }, { content: "c" }],
        [{ content: "d" }, { content: "e" }, { content: "f" }],
      ],
      {
        columnSpecs: [{ width: "auto" }, { width: 12 }, { width: 24 }],
        strokes: {
          row: [false, false, false],
          column: [false, true, false, true],
        },
      },
    );

    const updated = removeColumn(table, 1);

    expect(updated.rows[0]).toEqual([{ content: "a" }, { content: "c" }]);
    expect(updated.columnSpecs).toEqual([{ width: "auto" }, { width: 24 }]);
    expect(updated.strokes.column).toEqual([false, false, true]);
  });

  it("returns the original table when attempting to remove a column out of range", () => {
    const table = createEmptyTable(1, 1);

    const unchanged = removeColumn(table, 3);

    expect(unchanged).toBe(table);
  });

  it("updates a cell using direct values and updater functions", () => {
    const table = createEmptyTable(2, 2);

    const withContent = setCellContent(table, { row: 1, column: 1 }, "value");
    expect(withContent.rows[1][1].content).toBe("value");
    expect(table.rows[1][1].content).toBe("");

    const withAlign = setCellAlign(withContent, { row: 1, column: 1 }, () => ({
      horizontal: "right",
    }));
    expect(withAlign.rows[1][1].align).toEqual({ horizontal: "right" });

    const withBold = setCellBold(
      withAlign,
      { row: 1, column: 1 },
      (prev) => !prev,
    );
    expect(withBold.rows[1][1].bold).toBe(true);

    const withItalic = setCellItalic(withBold, { row: 1, column: 1 }, true);
    expect(withItalic.rows[1][1].italic).toBe(true);
  });

  it("ignores cell updates when the position is out of bounds", () => {
    const table = createEmptyTable(1, 1);

    const updatedContent = setCellContent(table, { row: -1, column: 0 }, "x");
    expect(updatedContent).toBe(table);

    const updatedAlign = setCellAlign(table, { row: 0, column: 5 }, () => ({
      horizontal: "center",
    }));
    expect(updatedAlign).toBe(table);
  });

  it("reports bounds correctly for valid and invalid positions", () => {
    const table = createEmptyTable(1, 1);

    expect(isInBounds(table, { row: 0, column: 0 })).toBe(true);
    expect(isInBounds(table, { row: 1, column: 0 })).toBe(false);
    expect(isInBounds(table, { row: 0, column: -1 })).toBe(false);
  });
});
