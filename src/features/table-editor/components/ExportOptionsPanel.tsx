import { createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Code } from "@/components/ui/code";
import { Description, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { ColumnsArgStyle } from "@/domain/typst/table/render-table";
import {
  tableEditorStore,
  updateTableRenderingOptions,
  updateWrapFigureEnabled,
  updateWrapFigureOptions,
} from "../store";

const ESCAPE_INLINE_MARKERS = ["#", "$", "[", "]", "@"] as const;

const COLUMN_STYLE_OPTIONS: SelectOption[] = [
  {
    id: "autoArray",
    label: "columns: (auto, auto, ...)",
    description: (
      <>
        Array of <Code>auto</Code> for each column.
      </>
    ),
  },
  {
    id: "count",
    label: "columns: n",
    description: "Column count only.",
  },
];

export function ExportOptionsPanel() {
  const wrapFigureEnabled = createMemo(
    () => tableEditorStore().wrapFigure.enabled,
  );
  const figureOptions = createMemo(
    () => tableEditorStore().wrapFigure.figureOptions,
  );
  const tableFormattingOptions = createMemo(
    () => tableEditorStore().tableRenderingOptions,
  );

  const handleColumnsArgStyleChange = (value: string) => {
    updateTableRenderingOptions((prev) => ({
      ...prev,
      columnsArgStyle: value as ColumnsArgStyle,
    }));
  };

  const handleEscapeToggle = (isSelected: boolean) => {
    updateTableRenderingOptions((prev) => ({
      ...prev,
      escapeCellContent: isSelected ? new Set(ESCAPE_INLINE_MARKERS) : false,
    }));
  };

  const escapeEnabled = createMemo(
    () => tableFormattingOptions().escapeCellContent !== false,
  );
  const columnsArgStyle = createMemo(
    () => tableFormattingOptions().columnsArgStyle ?? "autoArray",
  );

  return (
    <Card class="max-w-sm">
      <CardHeader>
        <CardTitle>Export options</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <Checkbox checked={escapeEnabled()} onChange={handleEscapeToggle}>
          <div class="space-y-1">
            <div class="text-sm font-medium">Escape symbols in cells</div>
            <Description>
              Escapes <Code>#</Code>, <Code>$</Code>, <Code>[</Code>,{" "}
              <Code>]</Code>, and <Code>@</Code> in table cells.
            </Description>
          </div>
        </Checkbox>

        <Select
          value={columnsArgStyle()}
          onChange={handleColumnsArgStyleChange}
          options={COLUMN_STYLE_OPTIONS}
          label="Columns argument"
          aria-label="Columns argument"
          placeholder="Choose columns argument"
        />

        <div class="space-y-3">
          <Checkbox
            checked={wrapFigureEnabled()}
            onChange={updateWrapFigureEnabled}
          >
            <span class="text-sm font-medium">
              Wrap in <Code>figure</Code>
            </span>
          </Checkbox>
          <div class="ml-4 space-y-3 border-l border-border pl-4">
            <TextField
              value={figureOptions().caption ?? ""}
              onChange={(value: string) => {
                updateWrapFigureOptions((prev) => {
                  const next = { ...prev };
                  if (value === "") {
                    delete next.caption;
                  } else {
                    next.caption = value;
                  }
                  return next;
                });
              }}
              disabled={!wrapFigureEnabled()}
            >
              <Label for="figure-caption">Caption</Label>
              <Input id="figure-caption" aria-label="figure caption" />
            </TextField>
            <TextField
              value={figureOptions().ref ?? ""}
              onChange={(value: string) => {
                updateWrapFigureOptions((prev) => {
                  const next = { ...prev };
                  if (value === "") {
                    delete next.ref;
                  } else {
                    next.ref = value;
                  }
                  return next;
                });
              }}
              disabled={!wrapFigureEnabled()}
            >
              <Label for="figure-ref">Reference label</Label>
              <Input id="figure-ref" aria-label="figure reference" />
            </TextField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
