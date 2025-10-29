"use client";

import type { Key } from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Cell } from "@/lib/table";
import { useTableEditorStore } from "../store";

type TableSelectionRange = {
  start: { rowIndex: number; columnIndex: number };
  end: { rowIndex: number; columnIndex: number };
};

const ALIGN_OPTIONS: Array<{
  id: Cell["align"];
  label: string;
}> = [
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "right", label: "Right" },
];

type ToggleState = "on" | "off" | "mixed";

export function TableInspector() {
  const selection = useTableEditorStore((state) => state.selection);
  const model = useTableEditorStore((state) => state.model);
  const actions = useTableEditorStore((state) => state.actions);

  const selectionRange = useMemo<TableSelectionRange | null>(() => {
    if (selection.range) {
      return selection.range;
    }
    if (selection.active) {
      return {
        start: selection.active,
        end: selection.active,
      };
    }
    return null;
  }, [selection]);

  const selectedCells = useMemo(() => {
    if (!selectionRange) {
      return [];
    }
    const cells: Cell[] = [];
    for (
      let rowIndex = selectionRange.start.rowIndex;
      rowIndex <= selectionRange.end.rowIndex;
      rowIndex += 1
    ) {
      for (
        let columnIndex = selectionRange.start.columnIndex;
        columnIndex <= selectionRange.end.columnIndex;
        columnIndex += 1
      ) {
        const cell = model.rows[rowIndex]?.[columnIndex];
        if (cell) {
          cells.push(cell);
        }
      }
    }
    return cells;
  }, [model.rows, selectionRange]);

  const boldState: ToggleState = useMemo(() => {
    if (selectedCells.length === 0) {
      return "off";
    }
    const someBold = selectedCells.some((cell) => cell.bold);
    const someNotBold = selectedCells.some((cell) => !cell.bold);
    if (someBold && someNotBold) {
      return "mixed";
    }
    return someBold ? "on" : "off";
  }, [selectedCells]);

  const italicState: ToggleState = useMemo(() => {
    if (selectedCells.length === 0) {
      return "off";
    }
    const someItalic = selectedCells.some((cell) => cell.italic);
    const someNotItalic = selectedCells.some((cell) => !cell.italic);
    if (someItalic && someNotItalic) {
      return "mixed";
    }
    return someItalic ? "on" : "off";
  }, [selectedCells]);

  const alignState = useMemo<Cell["align"] | "mixed">(() => {
    if (selectedCells.length === 0) {
      return "left";
    }
    const alignments = new Set<Cell["align"] | undefined>();
    selectedCells.forEach((cell) => {
      alignments.add(cell.align ?? "left");
    });
    if (alignments.size === 1) {
      const [value] = Array.from(alignments);
      return value ?? "left";
    }
    return "mixed";
  }, [selectedCells]);

  const handleToggleBold = () => {
    if (!selectionRange) {
      return;
    }
    const next = boldState !== "on";
    actions.editCells(selectionRange, { bold: next });
  };

  const handleToggleItalic = () => {
    if (!selectionRange) {
      return;
    }
    const next = italicState !== "on";
    actions.editCells(selectionRange, { italic: next });
  };

  const handleAlignChange = (keys: Iterable<Key>) => {
    if (!selectionRange) {
      return;
    }
    const [first] = Array.from(keys);
    if (!first || typeof first !== "string") {
      return;
    }
    actions.editCells(selectionRange, { align: first as Cell["align"] });
  };

  const activeLabel = selection.active
    ? `${selection.active.rowIndex + 1}:${selection.active.columnIndex + 1}`
    : "None";

  const rangeLabel = selection.range
    ? `${selection.range.start.rowIndex + 1}:${
        selection.range.start.columnIndex + 1
      } → ${selection.range.end.rowIndex + 1}:${
        selection.range.end.columnIndex + 1
      }`
    : "—";

  return (
    <div className="space-y-4 text-sm">
      <section className="space-y-1">
        <h3 className="text-xs font-semibold uppercase text-muted-fg">
          Selection
        </h3>
        <p>
          Active cell: <span className="font-medium">{activeLabel}</span>
        </p>
        <p>
          Range: <span className="font-medium">{rangeLabel}</span>
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase text-muted-fg">
          Cell formatting
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            intent={boldState === "on" ? "secondary" : "outline"}
            isDisabled={!selectionRange}
            onPress={handleToggleBold}
          >
            Bold
          </Button>
          <Button
            size="sm"
            intent={italicState === "on" ? "secondary" : "outline"}
            isDisabled={!selectionRange}
            onPress={handleToggleItalic}
          >
            Italic
          </Button>
        </div>
        <ToggleGroup
          size="sm"
          selectionMode="single"
          selectedKeys={
            alignState === "mixed" ? new Set() : new Set([alignState ?? "left"])
          }
          onSelectionChange={handleAlignChange}
          isDisabled={!selectionRange}
        >
          {ALIGN_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.id} id={option.id}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
    </div>
  );
}
