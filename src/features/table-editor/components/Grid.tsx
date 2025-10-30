import "react-datasheet-grid/dist/style.css";

import { useStore } from "@tanstack/react-store";
import { memo, useCallback, useLayoutEffect, useRef } from "react";
import { Input } from "react-aria-components";
import {
  type CellProps,
  type Column,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid";
import type { Cell, SelectionWithId } from "react-datasheet-grid/dist/types";
import { tv } from "tailwind-variants";
import { withCellContent } from "@/domain/typst/table/table";
import {
  cellSelector,
  cellStrokeSelector,
  cellStrokes,
  clearActiveCell,
  clearSelection,
  type DatasheetGridRow,
  selectCellRange,
  setActiveCell,
  tableData,
  tableEditorStore,
  updateTable,
} from "../store";
import { createColumnTitle } from "../utils";

const cellStyle = tv({
  base: [
    "dsg-input", // react-datasheet-gridのデフォルトスタイル
    "border-red-500",
  ],
  variants: {
    alignH: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    alignV: {
      top: "text-top",
      horizon: "text-middle",
      bottom: "text-bottom",
    },

    bold: {
      true: "font-bold",
    },
    italic: {
      true: "italic",
    },
  },

  defaultVariants: {
    alignH: undefined,
    alignV: undefined,

    bold: false,
    italic: false,
  },
});

// react-datasheet-gridのtextColumnを参考に作成
// https://github.com/nick-keller/react-datasheet-grid/blob/master/src/columns/textColumn.tsx
const CustomCell = memo(
  ({ rowIndex, columnIndex, focus }: CellProps<DatasheetGridRow>) => {
    const ref = useRef<HTMLInputElement>(null);
    const cell = useStore(
      tableEditorStore,
      cellSelector({ row: rowIndex, column: columnIndex }),
    );
    const stroke = useStore(
      cellStrokes,
      cellStrokeSelector({ row: rowIndex, column: columnIndex }),
    );

    useLayoutEffect(() => {
      if (focus) {
        ref.current?.focus();
        ref.current?.select();
      }

      ref.current?.blur();
    }, [focus]);

    if (!cell) {
      return <div>OUT OF BOUNDS</div>;
    }

    const setContent = (newContent: string) => {
      updateTable((t) =>
        withCellContent(t, { row: rowIndex, column: columnIndex }, newContent),
      );
    };

    return (
      <Input
        ref={ref}
        // react-datasheet-gridのスタイル
        className={cellStyle({
          alignH: cell.align?.horizontal,
          alignV: cell.align?.vertical,
          bold: cell.bold,
          italic: cell.italic,
        })}
        style={{ pointerEvents: focus ? "auto" : "none" }}
        // Cell単位でフォーカスを移動したいため、Inputがtabでフォーカスされることを防ぐ
        tabIndex={-1}
        value={cell.content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
        data-borderT={stroke.top || undefined}
        data-borderB={stroke.bottom || undefined}
        data-borderL={stroke.left || undefined}
        data-borderR={stroke.right || undefined}
      />
    );
  },
);

const customColumn = (): Column<DatasheetGridRow> => ({
  component: CustomCell,
});

export const Grid = () => {
  const table = useStore(tableData);
  const columns = table.columns.map((colKey, colIdx) => ({
    ...keyColumn(colKey, customColumn()),
    title: createColumnTitle(colIdx),
  }));

  const handleActiveCellChange = useCallback(
    ({ cell }: { cell: Cell | null }) => {
      console.log(cell);
      if (cell) {
        const { row, col } = cell;
        setActiveCell({ row, column: col });
      } else {
        clearActiveCell();
      }
    },
    [],
  );

  const handleSelectionChange = useCallback(
    ({ selection }: { selection: SelectionWithId | null }) => {
      if (selection) {
        const { min, max } = selection;
        selectCellRange({
          start: { row: min.row, column: min.col },
          end: { row: max.row, column: max.col },
        });
      } else {
        clearSelection();
      }
    },
    [],
  );

  return (
    <DataSheetGrid
      value={table.data}
      columns={columns}
      cellClassName={[
        "has-[[data-borderT]]:!border-t has-[[data-borderT]]:!border-t-fg",
        "has-[[data-borderB]]:!border-b has-[[data-borderB]]:!border-b-fg",
        "has-[[data-borderL]]:!border-l has-[[data-borderL]]:!border-l-fg",
        "has-[[data-borderR]]:!border-r has-[[data-borderR]]:!border-r-fg",
      ].join(" ")}
      addRowsComponent={false} // ツールバーUIで行追加するので不要
      onActiveCellChange={handleActiveCellChange}
      onSelectionChange={handleSelectionChange}
    />
  );
};
