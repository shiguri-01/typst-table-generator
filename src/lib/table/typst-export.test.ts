import { describe, expect, it } from "vitest";

import { createTableModel } from "./model";
import { renderTableModelToTypst } from "./typst-export";

describe("renderTableModelToTypst", () => {
  it("renders captioned table with strokes and styled cells", () => {
    const model = createTableModel({
      rows: [
        [{ text: "Metric" }, { text: "Value", bold: true, align: "right" }],
        [
          { text: "Accuracy", italic: true },
          { text: "0.953 (#)", align: "right" },
        ],
        [{ text: "Notes" }, { text: "See Appendix B] for detail" }],
      ],
      headerRows: 1,
      caption: "Model summary",
      columnSpecs: [{ width: "auto" }, { width: 48, align: "center" }],
      strokes: {
        rows: [{ bottom: 0.6 }, { bottom: 0.4 }, { top: 0.7, bottom: 0.8 }],
        columns: [
          { left: 0.3, right: "none" },
          { left: 0.2, right: 0.4 },
        ],
      },
    });

    const typst = renderTableModelToTypst(model);

    expect(typst).toMatchInlineSnapshot(`
"#figure(
  caption: [Model summary],
  body: [
  #table(
    columns: (auto, 48pt),
    align: (left, center),
    table.header(repeat: true)[
      [Metric] table.cell(align: right)[strong[Value]],
    ],
    table.hline(y: 1, stroke: 0.6pt),
    table.hline(y: 2, stroke: 0.7pt),
    table.hline(y: 3, stroke: 0.8pt),
    table.vline(x: 0, stroke: 0.3pt),
    table.vline(x: 1, stroke: 0.2pt),
    table.vline(x: 2, stroke: 0.4pt),
    [emph[Accuracy]] table.cell(align: right)[0.953 (#)],
    [Notes] [See Appendix B\\] for detail],
  )
  ],
)"
    `);
  });

  it("respects options and avoids duplicating escapes", () => {
    const model = createTableModel({
      rows: [
        [{ text: "Escaped" }, { text: "Already \\] ok", italic: true }],
        [{ text: "Literal #", align: "center" }, { text: "" }],
      ],
      headerRows: 1,
      caption: "Check ] figure",
      columnSpecs: [{ width: 24 }, { width: "auto" }],
      strokes: {
        rows: [{ top: 0.4 }],
      },
    });

    const typst = renderTableModelToTypst(model, {
      wrapFigure: false,
      repeatHeader: false,
      indent: "    ",
    });

    expect(typst).toMatchInlineSnapshot(`
"#table(
    columns: (24pt, auto),
    table.header(repeat: false)[
        [Escaped] [emph[Already \\] ok]],
    ],
    table.hline(y: 0, stroke: 0.4pt),
    table.cell(align: center)[Literal #] [],
)"
    `);
  });

  it("omits align directive when all columns use defaults", () => {
    const model = createTableModel({
      rows: [[{ text: "Only" }]],
      caption: null,
    });

    const typst = renderTableModelToTypst(model);

    expect(typst).not.toContain("align:");
  });

  it("escapes inline markers without double escaping existing sequences", () => {
    const model = createTableModel({
      rows: [
        [{ text: "Literal # and [brackets]" }, { text: "Already \\# ok" }],
      ],
      caption: null,
    });

    const typst = renderTableModelToTypst(model, { wrapFigure: false });

    expect(typst).toMatchInlineSnapshot(`
"#table(
  columns: (auto, auto),
  [Literal \\# and \\[brackets\\]] [Already \\# ok],
)"
    `);
  });
});
