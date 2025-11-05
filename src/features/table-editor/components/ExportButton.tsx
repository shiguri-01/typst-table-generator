import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconFile,
  IconFileExport,
} from "@tabler/icons-react";
import { useStore } from "@tanstack/react-store";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { generateTypstCode } from "../export";
import {
  exportStateSelector,
  setExportModal,
  tableEditorStore,
  updateExportedCode,
} from "../store";

export function ExportButton() {
  const { lastExportedCode } = useStore(tableEditorStore, exportStateSelector);

  const handleExportTypst = () => {
    const state = tableEditorStore.state;
    const code = generateTypstCode(
      state.table,
      state.tableRenderingOptions,
      state.wrapFigure.enabled,
      state.wrapFigure.figureOptions,
    );

    updateExportedCode(code);
    setExportModal(true);
  };

  const handleExportAndCopy = async () => {
    const state = tableEditorStore.state;
    const code = generateTypstCode(
      state.table,
      state.tableRenderingOptions,
      state.wrapFigure.enabled,
      state.wrapFigure.figureOptions,
    );

    updateExportedCode(code);
    await navigator.clipboard.writeText(code);
  };

  const handleExportAndDownload = () => {
    const state = tableEditorStore.state;
    const code = generateTypstCode(
      state.table,
      state.tableRenderingOptions,
      state.wrapFigure.enabled,
      state.wrapFigure.figureOptions,
    );

    updateExportedCode(code);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table.typ";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyExported = async () => {
    if (!lastExportedCode) return;
    await navigator.clipboard.writeText(lastExportedCode);
  };

  const handleDownloadExported = () => {
    if (!lastExportedCode) return;

    const blob = new Blob([lastExportedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table.typ";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShowLastExport = () => {
    if (!lastExportedCode) return;
    setExportModal(true);
  };

  return (
    <ButtonGroup>
      <Button onPress={handleExportTypst}>
        <IconFileExport data-slot="icon" aria-hidden />
        Export
      </Button>

      <Menu>
        <MenuTrigger>
          <Button aria-label="More export options">
            <IconChevronDown data-slot="icon" aria-hidden />
          </Button>
        </MenuTrigger>
        <MenuContent popover={{ placement: "bottom end" }}>
          <MenuSection label="Quick Actions">
            <MenuItem onAction={handleExportAndCopy}>
              <IconCopy data-slot="icon" aria-hidden />
              <MenuLabel>Export and Copy</MenuLabel>
            </MenuItem>
            <MenuItem onAction={handleExportAndDownload}>
              <IconDownload data-slot="icon" aria-hidden />
              <MenuLabel>Export and Download</MenuLabel>
            </MenuItem>
          </MenuSection>

          <MenuSeparator />

          <MenuSection label="Last export">
            <MenuItem
              onAction={handleShowLastExport}
              isDisabled={!lastExportedCode}
            >
              <IconFile data-slot="icon" aria-hidden />
              <MenuLabel>View Code</MenuLabel>
            </MenuItem>
            <MenuItem
              onAction={handleCopyExported}
              isDisabled={!lastExportedCode}
            >
              <IconCopy data-slot="icon" aria-hidden />
              <MenuLabel>Copy Code</MenuLabel>
            </MenuItem>
            <MenuItem
              onAction={handleDownloadExported}
              isDisabled={!lastExportedCode}
            >
              <IconDownload data-slot="icon" aria-hidden />
              <MenuLabel>Download .typ</MenuLabel>
            </MenuItem>
          </MenuSection>
        </MenuContent>
      </Menu>
    </ButtonGroup>
  );
}
