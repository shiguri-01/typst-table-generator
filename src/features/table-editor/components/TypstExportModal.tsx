import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useStore } from "@tanstack/react-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { renderFigure } from "@/domain/typst/figure";
import { renderTable } from "@/domain/typst/table/render-table";
import { cx } from "@/lib/primitive";
import type { TableEditorState } from "../store";
import {
  tableEditorStore,
  wrapFigureEnabledSelector,
  wrapFigureOptionsSelector,
} from "../store";

const tableStateSelector = (state: TableEditorState) => state.table;
const formattingOptionsSelector = (state: TableEditorState) =>
  state.tableRenderingOptions;

export function TypstExportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const table = useStore(tableEditorStore, tableStateSelector);
  const wrapFigureEnabled = useStore(
    tableEditorStore,
    wrapFigureEnabledSelector,
  );
  const figureOptions = useStore(tableEditorStore, wrapFigureOptionsSelector);
  const formattingOptions = useStore(
    tableEditorStore,
    formattingOptionsSelector,
  );

  const typstCode = useMemo(() => {
    const tableSnippet = renderTable(table, formattingOptions);
    if (wrapFigureEnabled) {
      return renderFigure(tableSnippet, figureOptions);
    }
    return tableSnippet;
  }, [figureOptions, formattingOptions, table, wrapFigureEnabled]);

  useEffect(() => {
    if (!isOpen) {
      setCopyStatus("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    void typstCode;
    setCopyStatus("idle");
  }, [typstCode]);

  useEffect(() => {
    if (copyStatus !== "copied") {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopyStatus("idle");
    }, 2000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copyStatus]);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(typstCode);
      } else {
        const fallback = document.createElement("textarea");
        fallback.value = typstCode;
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.appendChild(fallback);
        fallback.focus();
        fallback.select();
        document.execCommand("copy");
        document.body.removeChild(fallback);
      }
      setCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy Typst code", error);
      setCopyStatus("error");
    }
  }, [typstCode]);

  const copyLabel =
    copyStatus === "copied"
      ? "Copied"
      : copyStatus === "error"
        ? "Copy failed"
        : "Copy to clipboard";

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button intent="primary" size="sm">
        Export Typst
      </Button>
      <ModalContent
        size="3xl"
        isBlurred
        aria-label="Typst export modal"
        className={({ isEntering, isExiting }) =>
          cx(
            "max-w-4xl sm:max-w-3xl",
            isEntering && "sm:animate-in sm:fade-in",
            isExiting && "sm:animate-out sm:fade-out",
          )
        }
      >
        <ModalHeader
          title="Export Typst code"
          description="Preview and copy the generated Typst snippet."
        />
        <ModalBody className="space-y-4">
          <Card>
            <CardContent className="max-h-[60vh] overflow-auto bg-muted/40">
              <pre className="whitespace-pre text-sm font-mono leading-6">
                {typstCode}
              </pre>
            </CardContent>
          </Card>
        </ModalBody>
        <ModalFooter className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span aria-live="polite" className="text-sm text-muted-fg">
            {copyStatus === "copied"
              ? "Typst code copied to clipboard."
              : copyStatus === "error"
                ? "Failed to copy code."
                : "Options from the export panel are applied automatically."}
          </span>
          <div className="flex items-center gap-3">
            <ModalClose intent="plain">Close</ModalClose>
            <Button
              intent={copyStatus === "error" ? "danger" : "primary"}
              size="sm"
              onPress={handleCopy}
            >
              {copyStatus === "copied" ? (
                <IconCheck className="size-4" aria-hidden />
              ) : (
                <IconCopy className="size-4" aria-hidden />
              )}
              <span className="ml-2">{copyLabel}</span>
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
