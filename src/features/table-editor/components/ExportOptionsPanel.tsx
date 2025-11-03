import { useStore } from "@tanstack/react-store";
import type { Key } from "react-aria-components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Code } from "@/components/ui/code";
import { Description, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectDescription,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { ColumnsArgStyle } from "@/domain/typst/table/render-table";
import {
  tableEditorStore,
  updateTableRenderingOptions,
  updateWrapFigureEnabled,
  updateWrapFigureOptions,
  wrapFigureEnabledSelector,
  wrapFigureOptionsSelector,
} from "../store";

const ESCAPE_INLINE_MARKERS = ["#", "$", "[", "]", "@"] as const;

type ColumnStyleOption = {
  id: ColumnsArgStyle;
  label: string;
  description: React.ReactNode;
};

const COLUMN_STYLE_OPTIONS: ColumnStyleOption[] = [
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
  const wrapFigureEnabled = useStore(
    tableEditorStore,
    wrapFigureEnabledSelector,
  );
  const figureOptions = useStore(tableEditorStore, wrapFigureOptionsSelector);
  const tableFormattingOptions = useStore(
    tableEditorStore,
    (state) => state.tableRenderingOptions,
  );

  const handleWrapFigureToggle = (isSelected: boolean) => {
    updateWrapFigureEnabled(isSelected);
  };

  const handleFigureOptionChange =
    (field: "caption" | "ref") => (value: string) => {
      updateWrapFigureOptions((prev) => {
        const next = { ...prev };
        if (value === "") {
          delete next[field];
        } else {
          next[field] = value;
        }
        return next;
      });
    };

  const handleColumnsArgStyleChange = (key: Key | null) => {
    if (key == null) return;
    updateTableRenderingOptions((prev) => ({
      ...prev,
      columnsArgStyle: key as ColumnsArgStyle,
    }));
  };

  const handleEscapeToggle = (isSelected: boolean) => {
    updateTableRenderingOptions((prev) => ({
      ...prev,
      escapeCellContent: isSelected ? new Set(ESCAPE_INLINE_MARKERS) : false,
    }));
  };

  const escapeEnabled = tableFormattingOptions.escapeCellContent !== false;
  const columnsArgStyle = tableFormattingOptions.columnsArgStyle ?? "autoArray";

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Export options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Checkbox isSelected={escapeEnabled} onChange={handleEscapeToggle}>
          <Label className="font-medium">Escape symbols in cells</Label>
          <Description>
            Escapes <Code>#</Code>, <Code>$</Code>, <Code>[</Code>,{" "}
            <Code>]</Code>, and <Code>@</Code> in table cells.
          </Description>
        </Checkbox>

        <Select
          value={columnsArgStyle}
          onChange={handleColumnsArgStyleChange}
          aria-label="Columns argument"
          placeholder="Choose columns argument"
        >
          <Label>Columns argument</Label>
          <SelectTrigger />
          <SelectContent items={COLUMN_STYLE_OPTIONS}>
            {(item: ColumnStyleOption) => (
              <SelectItem id={item.id} textValue={item.label}>
                <SelectLabel>{item.label}</SelectLabel>
                <SelectDescription>{item.description}</SelectDescription>
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <div>
          <Checkbox
            isSelected={wrapFigureEnabled}
            onChange={handleWrapFigureToggle}
            className="mb-3"
          >
            <Label className="font-medium">
              Wrap in <Code>figure</Code>
            </Label>
          </Checkbox>
          <div className="ml-4 border-l border-border pl-4 space-y-3">
            <TextField
              value={figureOptions.caption ?? ""}
              onChange={handleFigureOptionChange("caption")}
              isDisabled={!wrapFigureEnabled}
            >
              <Label htmlFor="figure-caption">Caption</Label>
              <Input id="figure-caption" aria-label="figure caption" />
            </TextField>
            <TextField
              value={figureOptions.ref ?? ""}
              onChange={handleFigureOptionChange("ref")}
              isDisabled={!wrapFigureEnabled}
            >
              <Label htmlFor="figure-ref">Reference label</Label>
              <Input id="figure-ref" aria-label="figure reference" />
            </TextField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
