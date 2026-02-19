import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconDownload,
  IconFileExport,
  IconRefresh,
} from "@tabler/icons-solidjs";
import { createMemo, createSignal, onCleanup } from "solid-js";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { generateTypstCode } from "../export";
import {
  setCopyError,
  setExportModal,
  tableEditorStore,
  updateExportedCode,
} from "../store";
import { copyToClipboard } from "../utils";

export function ExportModal() {
  const exportState = createMemo(() => tableEditorStore().export);
  const [copied, setCopied] = createSignal(false);

  let copyResetTimeout: ReturnType<typeof setTimeout> | null = null;

  onCleanup(() => {
    if (copyResetTimeout !== null) {
      clearTimeout(copyResetTimeout);
      copyResetTimeout = null;
    }
  });

  const handleExport = () => {
    const state = tableEditorStore();
    const code = generateTypstCode(
      state.table,
      state.tableRenderingOptions,
      state.wrapFigure.enabled,
      state.wrapFigure.figureOptions,
    );
    updateExportedCode(code);
  };

  const handleCopy = async () => {
    const lastExportedCode = exportState().lastExportedCode;
    if (!lastExportedCode) return;

    setCopyError(false);
    const success = await copyToClipboard(lastExportedCode);

    if (success) {
      setCopied(true);
      if (copyResetTimeout !== null) {
        clearTimeout(copyResetTimeout);
      }
      copyResetTimeout = setTimeout(() => {
        setCopied(false);
        copyResetTimeout = null;
      }, 3000);
    } else {
      setCopyError(true);
    }
  };

  const handleDownload = () => {
    const lastExportedCode = exportState().lastExportedCode;
    if (!lastExportedCode) return;

    const blob = new Blob([lastExportedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "table.typ";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={exportState().showExportModal} onOpenChange={setExportModal}>
      <ModalContent size="4xl" class="@container/modal">
        <ModalHeader>
          <ModalTitle>Exported</ModalTitle>
        </ModalHeader>

        <ModalBody class="space-y-4">
          {exportState().isStale && <CodeStale handleExport={handleExport} />}
          {exportState().copyError && <CopyError />}

          {exportState().lastExportedCode ? (
            <CodeBlock language="typst" class="max-h-96">
              {exportState().lastExportedCode}
            </CodeBlock>
          ) : (
            <NoExportedCode handleExport={handleExport} />
          )}
        </ModalBody>

        <ModalFooter>
          <ModalClose>Close</ModalClose>
          <div
            class={cn(
              "grid gap-2",
              "[grid-template-areas:'copy''download']",
              "@md/modal:grid-cols-2 @md/modal:[grid-template-areas:'download_copy']",
            )}
          >
            <Button
              onClick={() => {
                void handleCopy();
              }}
              disabled={!exportState().lastExportedCode}
              class="[grid-area:copy]"
            >
              {copied() ? (
                <IconCheck class="h-4 w-4" aria-hidden />
              ) : (
                <IconCopy class="h-4 w-4" aria-hidden />
              )}
              {copied() ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              intent="outline"
              onClick={handleDownload}
              disabled={!exportState().lastExportedCode}
              class="[grid-area:download]"
            >
              <IconDownload class="h-4 w-4" aria-hidden />
              Download .typ
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function NoExportedCode(props: { handleExport: () => void }) {
  return (
    <div class="grid place-items-center gap-4 rounded-md bg-muted p-6 pt-8">
      <Text>No code has been exported yet.</Text>
      <Button onClick={props.handleExport} intent="outline" size="sm">
        <IconFileExport class="h-4 w-4" aria-hidden />
        Export now
      </Button>
    </div>
  );
}

function CodeStale(props: { handleExport: () => void }) {
  return (
    <div class="grid items-center gap-3 rounded-md bg-warning/10 p-4 @md:grid-cols-[1fr_auto]">
      <div class="grid grid-cols-[auto_1fr] gap-3">
        <IconAlertTriangle class="mt-0.5 h-5 w-5 text-warning" />
        <div>
          <Text class="font-medium text-fg">Table has been modified</Text>
          <Text class="text-muted-fg">
            The displayed code may not reflect the latest changes.
          </Text>
        </div>
      </div>
      <Button onClick={props.handleExport} size="sm" intent="outline">
        <IconRefresh class="h-4 w-4" aria-hidden />
        Re-export
      </Button>
    </div>
  );
}

function CopyError() {
  return (
    <div class="grid gap-3 rounded-md bg-danger/10 p-4">
      <div class="grid grid-cols-[auto_1fr] gap-3">
        <IconAlertTriangle class="mt-0.5 h-5 w-5 text-danger" />
        <div>
          <Text class="font-medium text-fg">Failed to copy to clipboard</Text>
          <Text class="text-muted-fg">
            Your browser may not support clipboard operations or permission was
            denied. Please manually select and copy the code above.
          </Text>
        </div>
      </div>
    </div>
  );
}
