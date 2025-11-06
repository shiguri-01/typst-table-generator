/**
 * Typst export use cases
 *
 * Combines domain logic (renderTable, renderFigure) to achieve export functionality.
 */

import { type FigureOption, renderFigure } from "@/domain/typst/figure";
import {
  renderTable,
  type TableFormattingOptions,
} from "@/domain/typst/table/render-table";
import type { Table } from "@/domain/typst/table/table";

/**
 * Generate Typst code with markup mode prefix (#)
 *
 * @param table - Table model
 * @param options - Table rendering options
 * @param wrapFigure - Whether to wrap with figure
 * @param figureOptions - Figure options (caption, ref)
 * @returns Generated Typst code starting with #
 */
export function generateTypstCode(
  table: Table,
  options: TableFormattingOptions,
  wrapFigure: boolean,
  figureOptions?: FigureOption,
): string {
  const tableCode = renderTable(table, options);
  const figureCode = wrapFigure
    ? renderFigure(tableCode, figureOptions)
    : tableCode;

  // Add # prefix for markup mode
  return `#${figureCode}`;
}
