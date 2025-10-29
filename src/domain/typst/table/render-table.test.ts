import { describe, expect, it } from "vitest";
import type { Cell } from "./cell";
import { renderCell, renderTable } from "./render-table";
import { createEmptyTable } from "./table";

describe("formatCell", () => {
  const createCell = (overrides: Partial<Cell> = {}): Cell => ({
    content: "hello",
    align: undefined,
    bold: undefined,
    italic: undefined,
    ...overrides,
  });

  it("formats basic cell content as content block", () => {
    const cell = createCell({ content: "world" });
    expect(renderCell(cell, {})).toBe("[world]");
  });

  it("applies escape to content when escapeContent is provided", () => {
    const cell = createCell({ content: "a//b" });
    expect(renderCell(cell, { escapeContent: new Set(["//"]) })).toBe(
      "[a\\//b]",
    );
  });

  it("applies italic formatting", () => {
    const cell = createCell({ italic: true });
    expect(renderCell(cell, {})).toBe("[_hello_]");
  });

  it("applies bold formatting", () => {
    const cell = createCell({ bold: true });
    expect(renderCell(cell, {})).toBe("[*hello*]");
  });

  it("applies both bold and italic formatting", () => {
    const cell = createCell({ bold: true, italic: true });
    expect(renderCell(cell, {})).toBe("[*_hello_*]");
  });

  it("applies align formatting using table.cell()", () => {
    const cell = createCell({ align: { horizontal: "left" } });
    expect(renderCell(cell, {})).toBe("table.cell(align: left, [hello])");
  });

  it("applies escape and then bold/italic formatting", () => {
    const cell = createCell({ content: "a//b", bold: true, italic: true });
    expect(renderCell(cell, { escapeContent: new Set(["//"]) })).toBe(
      "[*_a\\//b_*]",
    );
  });

  it("applies escape and align (escape before align)", () => {
    const cell = createCell({
      content: "a//b",
      align: { horizontal: "right" },
    });
    expect(renderCell(cell, { escapeContent: new Set(["//"]) })).toBe(
      "table.cell(align: right, [a\\//b])",
    );
  });

  it("handles empty content", () => {
    const cell = createCell({ content: "" });
    expect(renderCell(cell, {})).toBe("[]");
  });

  it("handles undefined options gracefully", () => {
    const cell = createCell();
    expect(renderCell(cell, { escapeContent: undefined })).toBe("[hello]");
  });
});

describe("formatTable (domain/typst)", () => {
  function mk(rows: number, cols: number) {
    const t = createEmptyTable(rows, cols);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        t.rows[r][c].content = `R${r}C${c}`;
      }
    }
    return t;
  }

  it("places hlines where they visually appear and vlines at the end", () => {
    const t = mk(3, 2);
    t.headerRows = 1;
    // Outer frame and header separator
    t.strokes.row = [true, true, false, true]; // y:0,1,3
    // Left/right only (for 2 columns: boundaries are x:0..2)
    t.strokes.column = [true, false, true]; // x:0,2

    const out = renderTable(t, {});

    expect(out).toMatchInlineSnapshot(`
"table(
  columns: (auto, auto),
  align: auto,
  stroke: none,
  table.header(
    table.hline(),
    [R0C0], [R0C1]
  ),
  table.hline(),
  [R1C0], [R1C1],
  [R2C0], [R2C1],
  table.hline(),
  table.vline(x: 0),
  table.vline(x: 2)
)"
    `);
  });

  it("compacts a full grid into stroke: 1pt without explicit lines", () => {
    const t = mk(2, 2);
    t.headerRows = 1;
    t.strokes.row = [true, true, true];
    t.strokes.column = [true, true, true];

    const out = renderTable(t);
    expect(out).toContain("stroke: 1pt");
    expect(out).not.toContain("table.hline");
    expect(out).not.toContain("table.vline");
  });

  it("can emit columns as a count shorthand", () => {
    const t = mk(1, 3);
    const out = renderTable(t, { columnsArgStyle: "count" });
    expect(out).toContain("columns: 3,");
    expect(out).not.toContain("columns: (auto, auto, auto)");
  });

  it("renders bold/italic and escapes inline markers", () => {
    const t = mk(2, 2);
    t.rows[0][1].bold = true;
    t.rows[1][0].italic = true;
    t.rows[1][1].content = "A # B [C]"; // escape markers
    const out = renderTable(t, { escapeCellContent: new Set(["#", "[", "]"]) });
    expect(out).toContain("[*R0C1*]");
    expect(out).toContain("[_R1C0_]");
    expect(out).toContain("A \\# B \\[C\\]");
  });

  it("emits per-column align as an array when column specs vary", () => {
    const t = mk(1, 2);
    // set per-column alignment
    t.columnSpecs[0].align = { horizontal: "left" };
    t.columnSpecs[1].align = { horizontal: "center", vertical: "top" };

    const out = renderTable(t);
    // expect align to be emitted as an array with formatted values
    expect(out).toContain("align: (left, center + top)");
  });

  it("emits horizontal-only stroke shorthand when only horizontal strokes are enabled", () => {
    const t = mk(1, 1);
    // rows length 1 => strokes.row length 2
    t.strokes.row = [true, true]; // both top and bottom
    // no vertical strokes
    t.strokes.column = [false, false];

    const out = renderTable(t);
    expect(out).toContain("stroke: (x: 1pt, y: none)");
    // vertical vline entries should not be present
    expect(out).not.toContain("table.vline");
  });

  it("handles empty table (0 rows) without throwing and emits columns arg", () => {
    const t = createEmptyTable(0, 2);
    // ensure no rows
    expect(t.rows.length).toBe(0);

    const out = renderTable(t);
    // should still emit columns info and a valid table call
    expect(out).toContain("table(");
    expect(out).toContain("columns: (auto, auto)");
  });

  it("supports multiple header rows and emits them inside table.header", () => {
    const t = mk(4, 2);
    t.headerRows = 2;
    const out = renderTable(t);
    // header block should contain first two rows
    expect(out).toContain("table.header(");
    expect(out).toContain("[R0C0]");
    expect(out).toContain("[R1C0]");
    // body should still contain row 2 and 3
    expect(out).toContain("[R2C0]");
    expect(out).toContain("[R3C0]");
  });

  it("compacts a vertical-only grid into stroke: (x: none, y: 1pt)", () => {
    const t = mk(2, 2);
    t.headerRows = 0;
    t.strokes.row = [false, false, false];
    t.strokes.column = [true, true, true];

    const out = renderTable(t);
    expect(out).toContain("stroke: (x: none, y: 1pt)");
    // should not emit table.hline calls when using the vertical-only shorthand
    expect(out).not.toContain("table.hline");
  });

  it("emits columns as auto array by default (autoArray)", () => {
    const t = mk(1, 3);
    const out = renderTable(t);
    expect(out).toContain("columns: (auto, auto, auto)");
  });
});
