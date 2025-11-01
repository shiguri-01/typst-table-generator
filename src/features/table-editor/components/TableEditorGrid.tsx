import "react-datasheet-grid/dist/style.css";

import { useStore } from "@tanstack/react-store";
import { memo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Input, TextField } from "react-aria-components";
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
const TableEditorGridCell = memo(
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
      const input = ref.current;
      if (!input) {
        return;
      }

      if (focus) {
        input.focus();
        input.select();
      } else {
        input.blur();
      }
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
      <TextField
        value={cell.content}
        onChange={setContent}
        data-border-top={stroke.top || undefined}
        data-border-bottom={stroke.bottom || undefined}
        data-border-left={stroke.left || undefined}
        data-border-right={stroke.right || undefined}
        aria-label="cell input"
      >
        <Input
          ref={ref}
          // Cell単位でフォーカスを移動したいため、Inputがtabでフォーカスされることを防ぐ
          tabIndex={-1}
          className={cellStyle({
            alignH: cell.align?.horizontal,
            alignV: cell.align?.vertical,
            bold: cell.bold,
            italic: cell.italic,
          })}
          style={{ pointerEvents: focus ? "auto" : "none" }}
        />
      </TextField>
    );
  },
);

const gridColumn = (): Column<DatasheetGridRow> => ({
  component: TableEditorGridCell,
});

export const TableEditorGrid = () => {
  const table = useStore(tableData);
  const columns = table.columns.map((colKey, colIdx) => ({
    ...keyColumn(colKey, gridColumn()),
    title: createColumnTitle(colIdx),
  }));

  const handleActiveCellChange = useCallback(
    ({ cell }: { cell: Cell | null }) => {
      if (!cell) return;

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
      if (!selection) return;

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

  useEffect(() => {
    const unmountTableData = tableData.mount();
    // セルで参照されるストアだが、親のGridで一か所にまとめてマウントする
    const unmountCellStrokes = cellStrokes.mount();
    return () => {
      unmountTableData();
      unmountCellStrokes();
    };
  }, []);

  return (
    <DataSheetGrid
      value={table.data}
      columns={columns}
      cellClassName={[
        "has-[[data-border-top]]:!border-t has-[[data-border-top]]:!border-t-fg",
        "has-[[data-border-bottom]]:!border-b has-[[data-border-bottom]]:!border-b-fg",
        "has-[[data-border-left]]:!border-l has-[[data-border-left]]:!border-l-fg",
        "has-[[data-border-right]]:!border-r has-[[data-border-right]]:!border-r-fg",
      ].join(" ")}
      addRowsComponent={false} // ツールバーUIで行追加するので不要
      onActiveCellChange={handleActiveCellChange}
      onSelectionChange={handleSelectionChange}
    />
  );
};
