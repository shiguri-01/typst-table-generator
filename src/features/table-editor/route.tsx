"use client";

import { useEffect, useRef } from "react";
import { Toast } from "@/components/ui/toast";
import { createTableModel, type TableModel } from "@/lib/table";
import { TableCaptionEditor } from "./components/TableCaptionEditor";
import { TableEditorModals } from "./components/TableEditorModals";
import { TableEditorShell } from "./components/TableEditorShell";
import { TableExportPanel } from "./components/TableExportPanel";
import { TableGridView } from "./components/TableGridView";
import { TableInspector } from "./components/TableInspector";
import { TableToolbar } from "./components/TableToolbar";
import { STYLE_PRESETS, type StylePresetId } from "./presets";
import { useTableEditorStore } from "./store";

const LAST_TABLE_KEY = "ttg:lastTable";
const LAST_PRESET_KEY = "ttg:lastPreset";
const LAST_NAME_KEY = "ttg:lastTableName";

function isStylePresetId(value: unknown): value is StylePresetId {
  return typeof value === "string" && value in STYLE_PRESETS;
}

function safeParseTable(value: string): TableModel | null {
  try {
    const parsed = JSON.parse(value) as TableModel;
    return createTableModel(parsed);
  } catch (error) {
    console.warn("Failed to parse stored table model", error);
    return null;
  }
}

export function TableEditorRoute() {
  const actions = useTableEditorStore((state) => state.actions);
  const model = useTableEditorStore((state) => state.model);
  const presetId = useTableEditorStore((state) => state.presetId);
  const tableName = useTableEditorStore((state) => state.tableName);
  const isDirty = useTableEditorStore((state) => state.isDirty);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    hasHydrated.current = true;

    const rawModel = window.localStorage.getItem(LAST_TABLE_KEY);
    const parsedModel = rawModel ? safeParseTable(rawModel) : null;

    const storedPreset = window.localStorage.getItem(LAST_PRESET_KEY);
    const storedName = window.localStorage.getItem(LAST_NAME_KEY);

    if (parsedModel) {
      const effectivePreset = isStylePresetId(storedPreset)
        ? storedPreset
        : undefined;
      actions.load(parsedModel, { presetId: effectivePreset });
      if (storedName) {
        actions.setTableName(storedName);
      }
      actions.markClean();
    }
  }, [actions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(LAST_TABLE_KEY, JSON.stringify(model));
        window.localStorage.setItem(LAST_PRESET_KEY, presetId);
        window.localStorage.setItem(LAST_NAME_KEY, tableName);
      } catch (error) {
        console.warn("Failed to persist table model", error);
      }
    }, 500);

    return () => {
      window.clearTimeout(handle);
    };
  }, [model, presetId, tableName]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <>
      <TableEditorShell
        toolbar={<TableToolbar />}
        caption={<TableCaptionEditor />}
        grid={<TableGridView />}
        inspector={<TableInspector />}
        exportPanel={<TableExportPanel />}
      />
      <TableEditorModals />
      <Toast position="top-right" />
    </>
  );
}
