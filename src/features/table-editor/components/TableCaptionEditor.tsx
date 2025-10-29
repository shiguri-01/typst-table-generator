"use client";

import type { ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useTableEditorStore } from "../store";

export function TableCaptionEditor() {
  const caption = useTableEditorStore((state) => state.model.caption ?? "");
  const actions = useTableEditorStore((state) => state.actions);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    actions.setCaption(event.target.value);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-overlay/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-fg">Caption</span>
        <span className="text-xs text-muted-fg/80">
          {caption.length} characters
        </span>
      </div>
      <Textarea
        value={caption}
        onChange={handleChange}
        placeholder="Describe your table for Typst figure output…"
        aria-label="Table caption"
        rows={2}
      />
    </div>
  );
}
