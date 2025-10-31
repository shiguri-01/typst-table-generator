import {
  type Icon,
  IconAlignBoxCenterBottom,
  IconAlignBoxCenterMiddle,
  IconAlignBoxCenterTop,
  IconAlignCenter,
  IconAlignLeft2,
  IconAlignRight2,
  IconBold,
  IconBorderAll,
  IconBorderBottomPlus,
  IconBorderLeftPlus,
  IconBorderNone,
  IconBorderRightPlus,
  IconBorderTopPlus,
  IconColumnInsertLeft,
  IconColumnInsertRight,
  IconColumnRemove,
  IconItalic,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconRowRemove,
} from "@tabler/icons-react";
import { useStore } from "@tanstack/react-store";
import {
  Group,
  type GroupProps,
  type Key,
  type Selection,
  ToggleButtonGroup,
  Toolbar,
} from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import type { HorizontalAlign, VerticalAlign } from "@/domain/typst/alignment";
import { cx } from "@/lib/primitive";
import { cn } from "@/lib/utils";
import { type CellRange, getCellPositions, isSingleCell } from "../cell-range";
import {
  clearSelectionBorders,
  insertColumnLeftOfSelection,
  insertColumnRightOfSelection,
  insertRowAboveSelection,
  insertRowBelowSelection,
  removeSelectedColumns,
  removeSelectedRows,
  setSelectionBold,
  setSelectionBorderAll,
  setSelectionBorderBottom,
  setSelectionBorderLeft,
  setSelectionBorderRight,
  setSelectionBorderTop,
  setSelectionHorizontalAlign,
  setSelectionItalic,
  setSelectionVerticalAlign,
  tableEditorStore,
} from "../store";
import { cellName } from "../utils";

type ToggleSelection = Selection;

export function GridToolBar() {
  const selectionSummary = useSelectionFormattingSummary();
  const hasSelection = selectionSummary.selection !== null;

  return (
    <Toolbar className="flex gap-6 px-4 py-2" aria-label="table editor toolbar">
      <SelectionIndicator />
      <ToolbarSeparator />
      <AlignControls summary={selectionSummary} hasSelection={hasSelection} />
      <ToolbarSeparator />
      <FormatControls summary={selectionSummary} hasSelection={hasSelection} />
      <ToolbarSeparator />
      <BorderControls hasSelection={hasSelection} />
      <ToolbarSeparator />
      <RowColControls hasSelection={hasSelection} />
    </Toolbar>
  );
}

type ToolbarGroupProps = GroupProps & {
  groupHeader: string;
};

function ToolbarGroup({
  className,
  children,
  groupHeader,
  ...rest
}: ToolbarGroupProps) {
  return (
    <Group
      {...rest}
      className={cx(
        ["[--gutter:--spacing(2)]", "grid gap-(--gutter) place-content-start"],
        className,
      )}
      aria-label={rest["aria-label"] ?? groupHeader}
    >
      {(renderProps) => (
        <>
          <div className="text-sm font-medium px-1">{groupHeader}</div>
          {typeof children === "function"
            ? children({ ...renderProps, defaultChildren: null })
            : children}
        </>
      )}
    </Group>
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="h-[stretch] my-2" />;
}

const toggleExtraStyles = cx([
  "[--toggle-selected-bg:var(--color-primary)] [--toggle-selected-fg:var(--color-primary-fg)]",
  "selected:bg-(--toggle-selected-bg) selected:text-(--toggle-selected-fg) selected:hover:bg-(--toggle-selected-bg)/90",
]);

type TriState = "all" | "mixed" | "none";

type SelectionFormattingSummary = {
  selection: CellRange | null;
  bold: TriState;
  italic: TriState;
  horizontal: HorizontalAlign | null;
  horizontalMixed: boolean;
  vertical: VerticalAlign | null;
  verticalMixed: boolean;
};

const EMPTY_SUMMARY: SelectionFormattingSummary = {
  selection: null,
  bold: "none",
  italic: "none",
  horizontal: null,
  horizontalMixed: false,
  vertical: null,
  verticalMixed: false,
};

// Collect selection formatting stats once so both align/format controls share a single store scan.
function useSelectionFormattingSummary(): SelectionFormattingSummary {
  return useStore(tableEditorStore, (state) => {
    const { selection, table } = state;
    if (!selection) {
      return EMPTY_SUMMARY;
    }

    const positions = getCellPositions(selection);
    let firstHorizontal = true;
    let horizontalValue: HorizontalAlign | null = null;
    let horizontalMixed = false;

    let firstVertical = true;
    let verticalValue: VerticalAlign | null = null;
    let verticalMixed = false;

    let boldAll = true;
    let boldAny = false;
    let italicAll = true;
    let italicAny = false;

    for (const pos of positions) {
      const cell = table.rows[pos.row]?.[pos.column];
      if (!cell) {
        continue;
      }

      const cellHorizontal = cell.align?.horizontal ?? null;
      if (firstHorizontal) {
        horizontalValue = cellHorizontal;
        firstHorizontal = false;
      } else if (horizontalValue !== cellHorizontal) {
        horizontalMixed = true;
      }

      const cellVertical = cell.align?.vertical ?? null;
      if (firstVertical) {
        verticalValue = cellVertical;
        firstVertical = false;
      } else if (verticalValue !== cellVertical) {
        verticalMixed = true;
      }

      const cellBold = Boolean(cell.bold);
      boldAny = boldAny || cellBold;
      boldAll = boldAll && cellBold;

      const cellItalic = Boolean(cell.italic);
      italicAny = italicAny || cellItalic;
      italicAll = italicAll && cellItalic;
    }

    const bold: TriState = boldAll ? "all" : boldAny ? "mixed" : "none";
    const italic: TriState = italicAll ? "all" : italicAny ? "mixed" : "none";

    return {
      selection,
      bold,
      italic,
      horizontal: horizontalMixed ? null : horizontalValue,
      horizontalMixed,
      vertical: verticalMixed ? null : verticalValue,
      verticalMixed,
    };
  });
}

function SelectionIndicator() {
  const selected = useStore(tableEditorStore, (state) => state.selection);

  return (
    <div className="flex flex-col gap-2 items-center justify-between min-w-20">
      <div className="shrink-0 text-sm">selection</div>
      <div
        className={cn(
          "flex-1 mb-2",
          "grid place-content-center place-items-center",
          "text-base font-medium",
        )}
      >
        {!selected && <div className="text-muted-fg">None</div>}

        {selected && <div>{cellName(selected.start)}</div>}
        {selected && !isSingleCell(selected) && (
          <div>{cellName(selected.end)}</div>
        )}
      </div>
    </div>
  );
}

type ToggleGroupItem<K extends string> = {
  id: K;
  ariaLabel: string;
  icon: Icon;
};

type AlignControlsProps = {
  summary: SelectionFormattingSummary;
  hasSelection: boolean;
};

const getSingleSelectionKey = (selection: ToggleSelection): Key | null => {
  if (selection === "all") {
    return null;
  }
  const keys = Array.from(selection);
  if (keys.length !== 1) {
    return null;
  }
  return keys[0];
};

const isHorizontalAlignKey = (key: Key): key is HorizontalAlign => {
  return key === "left" || key === "center" || key === "right";
};

const isVerticalAlignKey = (key: Key): key is VerticalAlign => {
  return key === "top" || key === "horizon" || key === "bottom";
};

function AlignControls({ summary, hasSelection }: AlignControlsProps) {
  const horizontalSelectedKey =
    !summary.horizontalMixed && summary.horizontal ? summary.horizontal : null;
  const verticalSelectedKey =
    !summary.verticalMixed && summary.vertical ? summary.vertical : null;

  const horizontalSelectedKeys = horizontalSelectedKey
    ? new Set<HorizontalAlign>([horizontalSelectedKey])
    : new Set<HorizontalAlign>();
  const verticalSelectedKeys = verticalSelectedKey
    ? new Set<VerticalAlign>([verticalSelectedKey])
    : new Set<VerticalAlign>();

  const handleHorizontalChange = (keys: ToggleSelection) => {
    if (!hasSelection) {
      return;
    }
    const key = getSingleSelectionKey(keys);
    if (key === null) {
      setSelectionHorizontalAlign(null);
      return;
    }
    if (isHorizontalAlignKey(key)) {
      setSelectionHorizontalAlign(key);
    }
  };

  const handleVerticalChange = (keys: ToggleSelection) => {
    if (!hasSelection) {
      return;
    }
    const key = getSingleSelectionKey(keys);
    if (key === null) {
      setSelectionVerticalAlign(null);
      return;
    }
    if (isVerticalAlignKey(key)) {
      setSelectionVerticalAlign(key);
    }
  };

  const horizontalItem: ToggleGroupItem<HorizontalAlign>[] = [
    {
      icon: IconAlignLeft2,
      id: "left",
      ariaLabel: "align left",
    },
    {
      icon: IconAlignCenter,
      id: "center",
      ariaLabel: "align center",
    },
    {
      icon: IconAlignRight2,
      id: "right",
      ariaLabel: "align right",
    },
  ];

  const verticalItem: ToggleGroupItem<VerticalAlign>[] = [
    {
      icon: IconAlignBoxCenterTop,
      id: "top",
      ariaLabel: "align top",
    },
    {
      icon: IconAlignBoxCenterMiddle,
      id: "horizon",
      ariaLabel: "align middle",
    },
    {
      icon: IconAlignBoxCenterBottom,
      id: "bottom",
      ariaLabel: "align bottom",
    },
  ];

  return (
    <ToolbarGroup groupHeader="align" aria-label="cell alignment">
      <ToggleButtonGroup
        className="flex gap-(--gutter)"
        selectionMode="single"
        aria-label="horizontal align"
        selectedKeys={horizontalSelectedKeys}
        onSelectionChange={handleHorizontalChange}
        isDisabled={!hasSelection}
      >
        {horizontalItem.map((item) => (
          <Toggle
            key={item.id}
            intent="plain"
            size="sq-sm"
            className={toggleExtraStyles}
            id={item.id}
            aria-label={item.ariaLabel}
            isDisabled={!hasSelection}
          >
            <item.icon />
          </Toggle>
        ))}
      </ToggleButtonGroup>

      <ToggleButtonGroup
        className="flex gap-(--gutter)"
        selectionMode="single"
        aria-label="vertical align"
        selectedKeys={verticalSelectedKeys}
        onSelectionChange={handleVerticalChange}
        isDisabled={!hasSelection}
      >
        {verticalItem.map((item) => (
          <Toggle
            key={item.id}
            intent="plain"
            size="sq-sm"
            className={toggleExtraStyles}
            id={item.id}
            aria-label={item.ariaLabel}
            isDisabled={!hasSelection}
          >
            <item.icon />
          </Toggle>
        ))}
      </ToggleButtonGroup>
    </ToolbarGroup>
  );
}

type FormatControlsProps = {
  summary: SelectionFormattingSummary;
  hasSelection: boolean;
};

function FormatControls({ summary, hasSelection }: FormatControlsProps) {
  const boldMixed = summary.bold === "mixed";
  const italicMixed = summary.italic === "mixed";

  return (
    <ToolbarGroup groupHeader="format" aria-label="cell format">
      <div className="flex gap-(--gutter)">
        <Toggle
          intent="plain"
          size="sq-sm"
          className={toggleExtraStyles}
          aria-label="bold"
          isDisabled={!hasSelection}
          isSelected={summary.bold === "all"}
          aria-pressed={boldMixed ? "mixed" : undefined}
          onChange={(selected) => {
            if (!hasSelection) return;
            setSelectionBold(selected);
          }}
        >
          <IconBold />
        </Toggle>
        <Toggle
          intent="plain"
          size="sq-sm"
          className={toggleExtraStyles}
          aria-label="italic"
          isDisabled={!hasSelection}
          isSelected={summary.italic === "all"}
          aria-pressed={italicMixed ? "mixed" : undefined}
          onChange={(selected) => {
            if (!hasSelection) return;
            setSelectionItalic(selected);
          }}
        >
          <IconItalic />
        </Toggle>
      </div>
    </ToolbarGroup>
  );
}

type BorderControlsProps = { hasSelection: boolean };

function BorderControls({ hasSelection }: BorderControlsProps) {
  return (
    <ToolbarGroup groupHeader="border" aria-label="cell border">
      <div
        className="
          grid grid-cols-3 gap-(--gutter)
          [grid-template-areas:'left_right_all''top_bottom_none']
        "
      >
        <Button
          className="[grid-area:right]"
          intent="outline"
          size="sq-md"
          aria-label="border right"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            setSelectionBorderRight();
          }}
        >
          <IconBorderRightPlus />
        </Button>
        <Button
          className="[grid-area:left]"
          intent="outline"
          size="sq-md"
          aria-label="border left"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            setSelectionBorderLeft();
          }}
        >
          <IconBorderLeftPlus />
        </Button>
        <Button
          className="[grid-area:top]"
          intent="outline"
          size="sq-md"
          aria-label="border top"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            setSelectionBorderTop();
          }}
        >
          <IconBorderTopPlus />
        </Button>
        <Button
          className="[grid-area:bottom]"
          intent="outline"
          size="sq-md"
          aria-label="border bottom"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            setSelectionBorderBottom();
          }}
        >
          <IconBorderBottomPlus />
        </Button>
        <Button
          className="[grid-area:all]"
          intent="outline"
          size="sq-md"
          aria-label="border all"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            setSelectionBorderAll();
          }}
        >
          <IconBorderAll />
        </Button>
        <Button
          className="[grid-area:none]"
          intent="outline"
          size="sq-md"
          aria-label="border none"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            clearSelectionBorders();
          }}
        >
          <IconBorderNone />
        </Button>
      </div>
    </ToolbarGroup>
  );
}

type RowColControlsProps = { hasSelection: boolean };

function RowColControls({ hasSelection }: RowColControlsProps) {
  return (
    <ToolbarGroup groupHeader="row / col" aria-label="rows and columns">
      <div className="grid grid-cols-3 gap-(--gutter)">
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add row above"
          onPress={insertRowAboveSelection}
        >
          <IconRowInsertTop />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add row below"
          onPress={insertRowBelowSelection}
        >
          <IconRowInsertBottom />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="remove row"
          className="hover:text-danger"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            removeSelectedRows();
          }}
        >
          <IconRowRemove />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add column left"
          onPress={insertColumnLeftOfSelection}
        >
          <IconColumnInsertLeft />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add column right"
          onPress={insertColumnRightOfSelection}
        >
          <IconColumnInsertRight />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="remove column"
          className="hover:text-danger"
          isDisabled={!hasSelection}
          onPress={() => {
            if (!hasSelection) return;
            removeSelectedColumns();
          }}
        >
          <IconColumnRemove />
        </Button>
      </div>
    </ToolbarGroup>
  );
}
