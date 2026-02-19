import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconFile,
  IconFileExport,
} from "@tabler/icons-solidjs";
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
  setCopyError,
  setExportModal,
  tableEditorStore,
  updateExportedCode,
} from "../store";
import { copyToClipboard } from "../utils";

export function ExportButton() {
  const generateCurrentTypstCode = () => {
    const state = tableEditorStore();
    return generateTypstCode(
      state.table,
      state.tableRenderingOptions,
      state.wrapFigure.enabled,
      state.wrapFigure.figureOptions,
    );
  };

  const handleExportTypst = () => {
    const code = generateCurrentTypstCode();
    updateExportedCode(code);
    setCopyError(false);
    setExportModal(true);
  };

  const handleExportAndCopy = async () => {
    const code = generateCurrentTypstCode();
    updateExportedCode(code);
    const success = await copyToClipboard(code);

    if (!success) {
      setCopyError(true);
      setExportModal(true);
    } else {
      setCopyError(false);
    }
  };

  const handleExportAndDownload = () => {
    const code = generateCurrentTypstCode();
    updateExportedCode(code);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "table.typ";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleCopyExported = async () => {
    const { lastExportedCode } = exportStateSelector(tableEditorStore());
    if (!lastExportedCode) return;

    const success = await copyToClipboard(lastExportedCode);

    if (!success) {
      setCopyError(true);
      setExportModal(true);
    } else {
      setCopyError(false);
    }
  };

  const handleDownloadExported = () => {
    const { lastExportedCode } = exportStateSelector(tableEditorStore());
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

  const handleShowLastExport = () => {
    const { lastExportedCode } = exportStateSelector(tableEditorStore());
    if (!lastExportedCode) return;
    setCopyError(false);
    setExportModal(true);
  };

  const hasLastExport = () =>
    exportStateSelector(tableEditorStore()).lastExportedCode !== null;

  return (
    <ButtonGroup>
      <Button onClick={handleExportTypst}>
        <IconFileExport class="h-4 w-4" aria-hidden />
        Export
      </Button>

      <Menu>
        <MenuTrigger class="h-9 w-9" aria-label="More export options">
          <IconChevronDown class="h-4 w-4" aria-hidden />
        </MenuTrigger>
        <MenuContent>
          <MenuSection label="Quick Actions">
            <MenuItem
              onSelect={() => {
                void handleExportAndCopy();
              }}
            >
              <IconCopy class="h-4 w-4" aria-hidden />
              <MenuLabel>Export and Copy</MenuLabel>
            </MenuItem>
            <MenuItem onSelect={handleExportAndDownload}>
              <IconDownload class="h-4 w-4" aria-hidden />
              <MenuLabel>Export and Download</MenuLabel>
            </MenuItem>
          </MenuSection>

          <MenuSeparator />

          <MenuSection label="Last export">
            <MenuItem
              onSelect={handleShowLastExport}
              disabled={!hasLastExport()}
            >
              <IconFile class="h-4 w-4" aria-hidden />
              <MenuLabel>View Code</MenuLabel>
            </MenuItem>
            <MenuItem
              onSelect={() => {
                void handleCopyExported();
              }}
              disabled={!hasLastExport()}
            >
              <IconCopy class="h-4 w-4" aria-hidden />
              <MenuLabel>Copy Code</MenuLabel>
            </MenuItem>
            <MenuItem
              onSelect={handleDownloadExported}
              disabled={!hasLastExport()}
            >
              <IconDownload class="h-4 w-4" aria-hidden />
              <MenuLabel>Download .typ</MenuLabel>
            </MenuItem>
          </MenuSection>
        </MenuContent>
      </Menu>
    </ButtonGroup>
  );
}
