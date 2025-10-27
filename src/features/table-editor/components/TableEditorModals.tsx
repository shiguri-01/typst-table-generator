"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, ModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createTableModel, renderTableModelToTypst } from "@/lib/table";
import { useTableEditorStore } from "../store";

export function TableEditorModals() {
  const modals = useTableEditorStore((state) => state.modals);
  const model = useTableEditorStore((state) => state.model);
  const actions = useTableEditorStore((state) => state.actions);

  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!modals.import) {
      setJsonInput("");
      setJsonError(null);
    }
  }, [modals.import]);

  const typstPreview = useMemo(() => renderTableModelToTypst(model), [model]);

  const handleCopyTypst = async () => {
    try {
      await navigator.clipboard.writeText(typstPreview);
      toast.success("Typst code copied");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy Typst code");
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
      toast.error("Download failed");
    }
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = createTableModel(parsed);
      actions.load(normalized);
      actions.setModal("import", false);
      toast.success("Table imported");
    } catch (error) {
      console.error(error);
      setJsonError("Invalid table JSON");
    }
  };

  return (
    <>
      <ModalOverlay
        isOpen={modals.export}
        onOpenChange={(open) => actions.setModal("export", open)}
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      >
        <Modal className="w-full max-w-3xl">
          <Dialog className="overflow-hidden rounded-xl border border-border/60 bg-overlay text-overlay-fg shadow-xl">
            <DialogHeader title="Typst export" />
            <DialogBody className="space-y-3">
              <DialogDescription>
                Review and copy the generated Typst snippet.
              </DialogDescription>
              <pre className="max-h-96 overflow-auto rounded-md bg-background px-3 py-2 text-xs font-mono leading-5 text-muted-fg">
                {typstPreview}
              </pre>
            </DialogBody>
            <DialogFooter>
              <DialogClose intent="outline">Close</DialogClose>
              <Button intent="outline" onPress={handleDownloadTypst}>
                Download .typ
              </Button>
              <Button onPress={handleCopyTypst}>Copy Typst</Button>
            </DialogFooter>
          </Dialog>
        </Modal>
      </ModalOverlay>

      <ModalOverlay
        isOpen={modals.import}
        onOpenChange={(open) => actions.setModal("import", open)}
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      >
        <Modal className="w-full max-w-2xl">
          <Dialog className="overflow-hidden rounded-xl border border-border/60 bg-overlay text-overlay-fg shadow-xl">
            <DialogHeader title="Import table JSON" />
            <DialogBody className="space-y-3">
              <DialogDescription>
                Paste a previously exported JSON snapshot. The current table
                will be replaced.
              </DialogDescription>
              <Textarea
                value={jsonInput}
                onChange={(event) => {
                  setJsonInput(event.target.value);
                  setJsonError(null);
                }}
                rows={8}
                placeholder='{"rows":[["A","B"]]}'
                aria-label="Table JSON"
              />
              {jsonError && <p className="text-sm text-danger">{jsonError}</p>}
            </DialogBody>
            <DialogFooter>
              <DialogClose intent="outline">Cancel</DialogClose>
              <Button onPress={handleImportJson}>Import</Button>
            </DialogFooter>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
