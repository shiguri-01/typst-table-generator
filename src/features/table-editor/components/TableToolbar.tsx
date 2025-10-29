"use client";

import {
  IconAdjustmentsHorizontal,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCrosshair,
  IconMinus,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import type { ChangeEvent, Key } from "react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { NumberField } from "@/components/ui/number-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/toolbar";
import { STYLE_PRESETS, type StylePresetId } from "../presets";
import { useTableEditorStore } from "../store";

const PRESET_IDS = Object.keys(STYLE_PRESETS) as StylePresetId[];

export function TableToolbar() {
  const tableName = useTableEditorStore((state) => state.tableName);
  const presetId = useTableEditorStore((state) => state.presetId);
  const headerRows = useTableEditorStore(
    (state) => state.model.headerRows ?? 0,
  );
  const rowCount = useTableEditorStore((state) => state.model.rows.length);
  const columnCount = useTableEditorStore(
    (state) => state.model.rows[0]?.length ?? 0,
  );
  const selection = useTableEditorStore((state) => state.selection);
  const canUndo = useTableEditorStore((state) => state.history.past.length > 0);
  const canRedo = useTableEditorStore(
    (state) => state.history.future.length > 0,
  );
  const actions = useTableEditorStore((state) => state.actions);

  const selectedRows = useMemo(() => {
    if (selection.range) {
      const indexes: number[] = [];
      for (
        let rowIndex = selection.range.start.rowIndex;
        rowIndex <= selection.range.end.rowIndex;
        rowIndex += 1
      ) {
        indexes.push(rowIndex);
      }
      return indexes.filter((rowIndex) => rowIndex >= 0 && rowIndex < rowCount);
    }
    if (selection.active) {
      const rowIndex = selection.active.rowIndex;
      return rowIndex >= 0 && rowIndex < rowCount ? [rowIndex] : [];
    }
    return [];
  }, [selection, rowCount]);

  const selectedColumns = useMemo(() => {
    if (selection.range) {
      const indexes: number[] = [];
      for (
        let columnIndex = selection.range.start.columnIndex;
        columnIndex <= selection.range.end.columnIndex;
        columnIndex += 1
      ) {
        indexes.push(columnIndex);
      }
      return indexes.filter(
        (columnIndex) => columnIndex >= 0 && columnIndex < columnCount,
      );
    }
    if (selection.active) {
      const columnIndex = selection.active.columnIndex;
      return columnIndex >= 0 && columnIndex < columnCount ? [columnIndex] : [];
    }
    return [];
  }, [selection, columnCount]);

  const handleTableNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    actions.setTableName(event.target.value);
  };

  const handlePresetChange = useCallback(
    (keys: Iterable<Key>) => {
      const [first] = Array.from(keys);
      if (!first || typeof first !== "string") {
        return;
      }
      const nextId = first as StylePresetId;
      if (nextId === presetId) {
        return;
      }
      actions.applyPreset(nextId);
    },
    [actions, presetId],
  );

  const handleInsertRow = () => {
    const rowIndex =
      selection.active?.rowIndex !== undefined
        ? selection.active.rowIndex + 1
        : rowCount;
    actions.insertRow(rowIndex);
  };

  const handleInsertColumn = () => {
    const columnIndex =
      selection.active?.columnIndex !== undefined
        ? selection.active.columnIndex + 1
        : columnCount;
    actions.insertColumn(columnIndex);
  };

  const handleRemoveRows = () => {
    if (selectedRows.length === 0) {
      return;
    }
    actions.removeRows(selectedRows);
  };

  const handleRemoveColumns = () => {
    if (selectedColumns.length === 0) {
      return;
    }
    actions.removeColumns(selectedColumns);
  };

  const handleHeaderRowsChange = (value: number | null) => {
    const normalized = Number.isFinite(value) ? Math.floor(value ?? 0) : 0;
    const next = Math.max(0, Math.min(rowCount, normalized));
    actions.setHeaderRows(next);
  };

  const handleExportModal = () => actions.setModal("export", true);
  const handleImportModal = () => actions.setModal("import", true);

  const handleCopyJson = async () => {
    try {
      const model = useTableEditorStore.getState().model;
      await navigator.clipboard.writeText(JSON.stringify(model, null, 2));
      toast.success("Copied table JSON to clipboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy JSON");
    }
  };

  return (
    <Toolbar className="w-full flex-wrap gap-2">
      <ToolbarGroup className="items-center gap-2 pr-2">
        <span className="text-sm text-muted-fg">Table name</span>
        <div className="w-48 min-w-48">
          <Input
            value={tableName}
            onChange={handleTableNameChange}
            aria-label="Table name"
          />
        </div>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="items-center gap-2">
        <span className="text-sm text-muted-fg">Preset</span>
        <ToggleGroup
          size="sm"
          selectedKeys={new Set([presetId])}
          onSelectionChange={handlePresetChange}
        >
          {PRESET_IDS.map((id) => (
            <ToggleGroupItem key={id} id={id}>
              {id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="items-center gap-1">
        <Button intent="outline" size="sm" onPress={handleInsertRow}>
          <IconPlus className="size-4" />
          Row
        </Button>
        <Button
          intent="outline"
          size="sm"
          isDisabled={selectedRows.length === 0}
          onPress={handleRemoveRows}
        >
          <IconMinus className="size-4" />
          Row
        </Button>
        <Button intent="outline" size="sm" onPress={handleInsertColumn}>
          <IconPlus className="size-4" />
          Col
        </Button>
        <Button
          intent="outline"
          size="sm"
          isDisabled={selectedColumns.length === 0}
          onPress={handleRemoveColumns}
        >
          <IconMinus className="size-4" />
          Col
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="items-center gap-1">
        <Button
          intent="outline"
          size="sm"
          isDisabled={!canUndo}
          onPress={actions.undo}
          aria-label="Undo"
        >
          <IconArrowBackUp className="size-4" />
        </Button>
        <Button
          intent="outline"
          size="sm"
          isDisabled={!canRedo}
          onPress={actions.redo}
          aria-label="Redo"
        >
          <IconArrowForwardUp className="size-4" />
        </Button>
        <Button
          intent="outline"
          size="sm"
          onPress={() => actions.setSelection({ active: null, range: null })}
          aria-label="Clear selection"
        >
          <IconCrosshair className="size-4" />
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="items-center gap-2">
        <span className="text-sm text-muted-fg">Header rows</span>
        <NumberField
          minValue={0}
          maxValue={rowCount}
          aria-label="Header rows"
          value={headerRows}
          onChange={handleHeaderRowsChange}
          className="w-28"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup className="items-center gap-2">
        <Menu>
          <MenuTrigger
            className={`${buttonStyles({
              intent: "outline",
              size: "sm",
            })} min-w-[8rem] justify-between`}
          >
            <span className="flex items-center gap-2">
              <IconAdjustmentsHorizontal className="size-4" />
              Export
            </span>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onAction={handleExportModal}>Typst export…</MenuItem>
            <MenuItem onAction={handleCopyJson}>Copy JSON</MenuItem>
            <MenuItem onAction={handleImportModal}>Import JSON…</MenuItem>
          </MenuContent>
        </Menu>
        <Button intent="secondary" onPress={handleExportModal}>
          <IconRefresh className="mr-2 size-4" />
          Generate Typst
        </Button>
      </ToolbarGroup>
    </Toolbar>
  );
}
