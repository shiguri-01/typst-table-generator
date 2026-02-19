import {
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
} from "@tabler/icons-solidjs";
import { type Component, createMemo, For, type JSX } from "solid-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import type { HorizontalAlign, VerticalAlign } from "@/domain/typst/alignment";
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

const toolbarGroupClass = "grid gap-2 place-content-start";

const calcSelectionSummary = (): SelectionFormattingSummary => {
  const state = tableEditorStore();
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
  let visitedCount = 0;

  for (const pos of positions) {
    const cell = table.rows[pos.row]?.[pos.column];
    if (!cell) {
      continue;
    }
    visitedCount += 1;

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

  const bold: TriState =
    visitedCount === 0 ? "none" : boldAll ? "all" : boldAny ? "mixed" : "none";
  const italic: TriState =
    visitedCount === 0
      ? "none"
      : italicAll
        ? "all"
        : italicAny
          ? "mixed"
          : "none";

  return {
    selection,
    bold,
    italic,
    horizontal: horizontalMixed ? null : horizontalValue,
    horizontalMixed,
    vertical: verticalMixed ? null : verticalValue,
    verticalMixed,
  };
};

interface ToolbarGroupProps {
  groupHeader: string;
  class?: string;
  children?: JSX.Element;
}

function ToolbarGroup(props: ToolbarGroupProps) {
  return (
    <section
      class={cn(toolbarGroupClass, props.class)}
      aria-label={props.groupHeader}
    >
      <div class="px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">
        {props.groupHeader}
      </div>
      {props.children}
    </section>
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" class="mx-1 h-auto min-h-14" />;
}

function SelectionIndicator() {
  const selected = createMemo(() => tableEditorStore().selection);
  const startName = createMemo(() => {
    const value = selected();
    return value ? cellName(value.start) : null;
  });
  const endName = createMemo(() => {
    const value = selected();
    return value ? cellName(value.end) : null;
  });
  const isRange = createMemo(() => {
    const value = selected();
    return value ? !isSingleCell(value) : false;
  });

  return (
    <div class="flex min-w-20 flex-col items-center justify-between gap-2">
      <div class="text-xs font-semibold uppercase tracking-wide text-muted-fg">
        selection
      </div>
      <div class="grid min-h-11 place-items-center text-sm font-medium">
        {!selected() && <div class="text-muted-fg">None</div>}
        {startName() && <div>{startName()}</div>}
        {isRange() && endName() && <div>{endName()}</div>}
      </div>
    </div>
  );
}

type AlignItem<K extends string> = {
  id: K;
  ariaLabel: string;
  icon: Component<{ class?: string }>;
};

const horizontalItems: AlignItem<HorizontalAlign>[] = [
  { id: "left", ariaLabel: "align left", icon: IconAlignLeft2 },
  { id: "center", ariaLabel: "align center", icon: IconAlignCenter },
  { id: "right", ariaLabel: "align right", icon: IconAlignRight2 },
];

const verticalItems: AlignItem<VerticalAlign>[] = [
  { id: "top", ariaLabel: "align top", icon: IconAlignBoxCenterTop },
  {
    id: "horizon",
    ariaLabel: "align middle",
    icon: IconAlignBoxCenterMiddle,
  },
  {
    id: "bottom",
    ariaLabel: "align bottom",
    icon: IconAlignBoxCenterBottom,
  },
];

function AlignControls(props: {
  summary: SelectionFormattingSummary;
  hasSelection: boolean;
}) {
  return (
    <ToolbarGroup groupHeader="align" class="gap-1">
      <div class="flex gap-1">
        <For each={horizontalItems}>
          {(item) => (
            <Toggle
              aria-label={item.ariaLabel}
              pressed={props.summary.horizontal === item.id}
              disabled={!props.hasSelection}
              onChange={(pressed: boolean) => {
                if (!props.hasSelection) return;
                setSelectionHorizontalAlign(pressed ? item.id : null);
              }}
            >
              <item.icon class="h-4 w-4" />
            </Toggle>
          )}
        </For>
      </div>
      <div class="flex gap-1">
        <For each={verticalItems}>
          {(item) => (
            <Toggle
              aria-label={item.ariaLabel}
              pressed={props.summary.vertical === item.id}
              disabled={!props.hasSelection}
              onChange={(pressed: boolean) => {
                if (!props.hasSelection) return;
                setSelectionVerticalAlign(pressed ? item.id : null);
              }}
            >
              <item.icon class="h-4 w-4" />
            </Toggle>
          )}
        </For>
      </div>
    </ToolbarGroup>
  );
}

function FormatControls(props: {
  summary: SelectionFormattingSummary;
  hasSelection: boolean;
}) {
  return (
    <ToolbarGroup groupHeader="format">
      <div class="flex gap-1">
        <Toggle
          aria-label="bold"
          pressed={props.summary.bold === "all"}
          disabled={!props.hasSelection}
          onChange={(pressed: boolean) => {
            if (!props.hasSelection) return;
            setSelectionBold(pressed);
          }}
        >
          <IconBold class="h-4 w-4" />
        </Toggle>
        <Toggle
          aria-label="italic"
          pressed={props.summary.italic === "all"}
          disabled={!props.hasSelection}
          onChange={(pressed: boolean) => {
            if (!props.hasSelection) return;
            setSelectionItalic(pressed);
          }}
        >
          <IconItalic class="h-4 w-4" />
        </Toggle>
      </div>
    </ToolbarGroup>
  );
}

function BorderControls(props: { hasSelection: boolean }) {
  return (
    <ToolbarGroup groupHeader="border">
      <div class="grid grid-cols-3 gap-1">
        <Button
          intent="outline"
          size="sq-md"
          aria-label="border left"
          disabled={!props.hasSelection}
          onClick={setSelectionBorderLeft}
        >
          <IconBorderLeftPlus class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="border top"
          disabled={!props.hasSelection}
          onClick={setSelectionBorderTop}
        >
          <IconBorderTopPlus class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="border right"
          disabled={!props.hasSelection}
          onClick={setSelectionBorderRight}
        >
          <IconBorderRightPlus class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="border bottom"
          disabled={!props.hasSelection}
          onClick={setSelectionBorderBottom}
        >
          <IconBorderBottomPlus class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="border all"
          disabled={!props.hasSelection}
          onClick={setSelectionBorderAll}
        >
          <IconBorderAll class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="border none"
          disabled={!props.hasSelection}
          onClick={clearSelectionBorders}
        >
          <IconBorderNone class="h-4 w-4" />
        </Button>
      </div>
    </ToolbarGroup>
  );
}

function RowColControls(props: { hasSelection: boolean }) {
  return (
    <ToolbarGroup groupHeader="row / col">
      <div class="grid grid-cols-3 gap-1">
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add row above"
          onClick={insertRowAboveSelection}
        >
          <IconRowInsertTop class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add row below"
          onClick={insertRowBelowSelection}
        >
          <IconRowInsertBottom class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="remove row"
          disabled={!props.hasSelection}
          onClick={removeSelectedRows}
        >
          <IconRowRemove class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add column left"
          onClick={insertColumnLeftOfSelection}
        >
          <IconColumnInsertLeft class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="add column right"
          onClick={insertColumnRightOfSelection}
        >
          <IconColumnInsertRight class="h-4 w-4" />
        </Button>
        <Button
          intent="outline"
          size="sq-md"
          aria-label="remove column"
          disabled={!props.hasSelection}
          onClick={removeSelectedColumns}
        >
          <IconColumnRemove class="h-4 w-4" />
        </Button>
      </div>
    </ToolbarGroup>
  );
}

export function GridToolBar() {
  const summary = createMemo(calcSelectionSummary);
  const hasSelection = createMemo(() => summary().selection !== null);

  return (
    <div class="flex flex-wrap items-stretch gap-2 rounded-md border border-border bg-bg p-2">
      <SelectionIndicator />
      <ToolbarSeparator />
      <AlignControls summary={summary()} hasSelection={hasSelection()} />
      <ToolbarSeparator />
      <FormatControls summary={summary()} hasSelection={hasSelection()} />
      <ToolbarSeparator />
      <BorderControls hasSelection={hasSelection()} />
      <ToolbarSeparator />
      <RowColControls hasSelection={hasSelection()} />
    </div>
  );
}
