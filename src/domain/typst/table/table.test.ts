import { describe, expect, it } from "vitest";

import type { Cell } from "./cell";
import {
  createEmptyTable,
  dimensions,
  insertColumn,
  insertRow,
  isInBounds,
  removeColumn,
  removeRow,
  type Table,
  withCellAlign,
  withCellBold,
  withCellContent,
  withCellItalic,
  withColumnAlign,
  withColumnStroke,
  withRowStroke,
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
        strokes: {
          row: [false, false, false],
          column: [false, true, false, true],
        },
      },
    );

    const updated = removeColumn(table, 1);

    expect(updated.rows[0]).toEqual([{ content: "a" }, { content: "c" }]);
    expect(updated.strokes.column).toEqual([false, false, true]);
  });

  it("returns the original table when attempting to remove a column out of range", () => {
    const table = createEmptyTable(1, 1);

    const unchanged = removeColumn(table, 3);

    expect(unchanged).toBe(table);
  });

  it("updates a cell using direct values and updater functions", () => {
    const table = createEmptyTable(2, 2);

    const withContent = withCellContent(table, { row: 1, column: 1 }, "value");
    expect(withContent.rows[1][1].content).toBe("value");
    expect(table.rows[1][1].content).toBe("");

    const withAlign = withCellAlign(withContent, { row: 1, column: 1 }, () => ({
      horizontal: "right",
    }));
    expect(withAlign.rows[1][1].align).toEqual({ horizontal: "right" });

    const withBold = withCellBold(
      withAlign,
      { row: 1, column: 1 },
      (prev) => !prev,
    );
    expect(withBold.rows[1][1].bold).toBe(true);

    const withItalic = withCellItalic(withBold, { row: 1, column: 1 }, true);
    expect(withItalic.rows[1][1].italic).toBe(true);
  });

  it("ignores cell updates when the position is out of bounds", () => {
    const table = createEmptyTable(1, 1);

    const updatedContent = withCellContent(table, { row: -1, column: 0 }, "x");
    expect(updatedContent).toBe(table);

    const updatedAlign = withCellAlign(table, { row: 0, column: 5 }, () => ({
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

  it("sets per-column align and clears cell overrides with withColumnAlign", () => {
    const table = createEmptyTable(2, 2);

    // set a cell-level override in column 1
    const withOverride = withCellAlign(
      table,
      { row: 0, column: 1 },
      { horizontal: "right" },
    );

    const updated = withColumnAlign(withOverride, 1, { horizontal: "center" });

    // column spec updated
    expect(updated.columnSpecs[1].align).toEqual({ horizontal: "center" });

    // cell-level overrides in that column are cleared
    expect(updated.rows[0][1].align).toBeUndefined();
    expect(updated.rows[1][1].align).toBeUndefined();

    // other column remains untouched
    expect(updated.columnSpecs[0].align).toBeUndefined();
  });

  it("returns current dimensions of the table", () => {
    const table = createEmptyTable(3, 4);
    expect(dimensions(table)).toEqual({ rows: 3, columns: 4 });
  });

  it("updates row stroke boundary immutably and supports updater function", () => {
    const table = createEmptyTable(2, 2); // strokes.row length = 3

    const t1 = withRowStroke(table, 1, true);
    expect(t1.strokes.row).toEqual([false, true, false]);
    // updater toggles
    const t2 = withRowStroke(t1, 1, (prev) => !prev);
    expect(t2.strokes.row).toEqual([false, false, false]);
    // out of range is no-op
    const t3 = withRowStroke(t2, 99, true);
    expect(t3).toBe(t2);
  });

  it("updates column stroke boundary immutably and supports updater function", () => {
    const table = createEmptyTable(1, 3); // strokes.column length = 4

    const t1 = withColumnStroke(table, 0, true);
    expect(t1.strokes.column).toEqual([true, false, false, false]);
    // updater toggles
    const t2 = withColumnStroke(t1, 0, (prev) => !prev);
    expect(t2.strokes.column).toEqual([false, false, false, false]);
    // last boundary
    const t3 = withColumnStroke(t2, 3, true);
    expect(t3.strokes.column).toEqual([false, false, false, true]);
    // out of range is no-op
    const t4 = withColumnStroke(t3, -1, true);
    expect(t4).toBe(t3);
  });
});
