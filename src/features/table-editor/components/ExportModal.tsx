import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconDownload,
  IconFileExport,
  IconRefresh,
} from "@tabler/icons-react";
import { useStore } from "@tanstack/react-store";
import { useState } from "react";
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
  exportStateSelector,
  setCopyError,
  setExportModal,
  tableEditorStore,
  updateExportedCode,
} from "../store";
import { copyToClipboard } from "../utils";

export function ExportModal() {
  const exportState = useStore(tableEditorStore, exportStateSelector);
  const { showExportModal, lastExportedCode, isStale, copyError } = exportState;
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const state = tableEditorStore.state;
    const code = generateTypstCode(
      state.table,
      state.tableRenderingOptions,
      state.wrapFigure.enabled,
      state.wrapFigure.figureOptions,
    );

    updateExportedCode(code);
  };

  const handleCopy = async () => {
    if (!lastExportedCode) return;

    setCopyError(false);
    const success = await copyToClipboard(lastExportedCode);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setCopyError(true);
    }
  };

  const handleDownload = () => {
    if (!lastExportedCode) return;

    const blob = new Blob([lastExportedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table.typ";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={showExportModal} onOpenChange={setExportModal}>
      <ModalContent size="4xl" className="@container/modal">
        <ModalHeader>
          <ModalTitle>Exported</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {isStale && <CodeStale handleExport={handleExport} />}
          {copyError && <CopyError />}

          {lastExportedCode ? (
            <CodeBlock language="typst" className="max-h-96">
              {lastExportedCode}
            </CodeBlock>
          ) : (
            <NoExportedCode handleExport={handleExport} />
          )}
        </ModalBody>

        <ModalFooter>
          <ModalClose>Close</ModalClose>
          <div
            className={cn(
              "grid gap-2",
              "[grid-template-areas:'copy''download']",
              "@md/modal:grid-cols-2 @md/modal:[grid-template-areas:'download_copy']",
            )}
          >
            <Button
              intent="primary"
              onPress={handleCopy}
              isDisabled={!lastExportedCode}
              className="[grid-area:copy]"
            >
              {copied ? (
                <IconCheck data-slot="icon" aria-hidden />
              ) : (
                <IconCopy data-slot="icon" aria-hidden />
              )}
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              intent="outline"
              onPress={handleDownload}
              isDisabled={!lastExportedCode}
              className="[grid-area:download]"
            >
              <IconDownload data-slot="icon" aria-hidden />
              Download .typ
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function NoExportedCode({ handleExport }: { handleExport: () => void }) {
  return (
    <div className="grid gap-4 place-items-center bg-muted p-6 pt-8 rounded-md">
      <Text>No code has been exported yet.</Text>
      <Button onPress={handleExport} intent="outline" size="sm">
        <IconFileExport data-slot="icon" aria-hidden />
        Export now
      </Button>
    </div>
  );
}

function CodeStale({ handleExport }: { handleExport: () => void }) {
  return (
    <div className="grid gap-3 items-center p-4 bg-warning/10 rounded-md @md:grid-cols-[1fr_auto]">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <IconAlertTriangle className="mt-0.5 size-5 text-warning" />
        <div>
          <Text className="font-medium text-fg">Table has been modified</Text>
          <Text className="text-muted-fg">
            The displayed code may not reflect the latest changes.
          </Text>
        </div>
      </div>
      <Button onPress={handleExport} size="sm" intent="outline">
        <IconRefresh data-slot="icon" aria-hidden className="size-4" />
        Re-export
      </Button>
    </div>
  );
}

function CopyError() {
  return (
    <div className="grid gap-3 items-center p-4 bg-danger/10 rounded-md">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <IconAlertTriangle className="mt-0.5 size-5 text-danger" />
        <div>
          <Text className="font-medium text-fg">
            Failed to copy to clipboard
          </Text>
          <Text className="text-muted-fg">
            Your browser may not support clipboard operations or permission was
            denied. Please manually select and copy the code above.
          </Text>
        </div>
      </div>
    </div>
  );
}
