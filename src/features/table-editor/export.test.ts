import { describe, expect, it } from "vitest";
import { DEFAULT_FORMAT_TABLE_OPTIONS } from "@/domain/typst/table/render-table";
import { createEmptyTable } from "@/domain/typst/table/table";
import { generateTypstCode } from "./export";

describe("generateTypstCode", () => {
  it("should add # prefix to table code", () => {
    const table = createEmptyTable(2, 2);
    const code = generateTypstCode(table, DEFAULT_FORMAT_TABLE_OPTIONS, false);

    expect(code).toMatch(/^#table\(/);
  });

  it("should wrap with figure when enabled", () => {
    const table = createEmptyTable(2, 2);
    const code = generateTypstCode(table, DEFAULT_FORMAT_TABLE_OPTIONS, true, {
      caption: "Test Table",
    });

    expect(code).toMatch(/^#figure\(/);
    expect(code).toContain("caption: Test Table");
  });

  it("should not wrap with figure when disabled", () => {
    const table = createEmptyTable(2, 2);
    const code = generateTypstCode(table, DEFAULT_FORMAT_TABLE_OPTIONS, false);

    expect(code).toMatch(/^#table\(/);
    expect(code).not.toContain("figure");
  });
});
