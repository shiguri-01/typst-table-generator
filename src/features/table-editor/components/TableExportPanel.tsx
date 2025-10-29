"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { renderTableModelToTypst } from "@/lib/table";
import { useTableEditorStore } from "../store";

export function TableExportPanel() {
  const model = useTableEditorStore((state) => state.model);
  const presetId = useTableEditorStore((state) => state.presetId);
  const actions = useTableEditorStore((state) => state.actions);

  const typstPreview = useMemo(() => renderTableModelToTypst(model), [model]);

  const rowCount = model.rows.length;
  const columnCount = model.rows[0]?.length ?? 0;

  const shortenedPreview = useMemo(() => {
    const lines = typstPreview.split("\n");
    if (lines.length <= 12) {
      return typstPreview;
    }
    return `${lines.slice(0, 12).join("\n")}\n…`;
  }, [typstPreview]);

  const handleCopyTypst = async () => {
    try {
      await navigator.clipboard.writeText(typstPreview);
      toast.success("Typst code copied to clipboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy Typst output");
    }
  };

  const handleDownloadTypst = () => {
    try {
      const blob = new Blob([typstPreview], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "table.typ";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download Typst file");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-overlay/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-fg">
        <span>
          <strong className="text-foreground">{rowCount}</strong> rows ·{" "}
          <strong className="text-foreground">{columnCount}</strong> columns
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-fg">
          preset: {presetId}
        </span>
      </div>
      <pre className="max-h-48 overflow-auto rounded-md bg-background px-3 py-2 text-xs font-mono leading-5 text-muted-fg/90">
        {shortenedPreview}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" intent="outline" onPress={handleCopyTypst}>
          Copy Typst
        </Button>
        <Button size="sm" intent="outline" onPress={handleDownloadTypst}>
          Download .typ
        </Button>
        <Button
          size="sm"
          intent="secondary"
          onPress={() => actions.setModal("export", true)}
        >
          Open export modal
        </Button>
      </div>
    </div>
  );
}
