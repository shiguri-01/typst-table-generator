import { createFileRoute } from "@tanstack/react-router";
import { ExportButton } from "@/features/table-editor/components/ExportButton";
import { ExportModal } from "@/features/table-editor/components/ExportModal";
import { ExportOptionsPanel } from "@/features/table-editor/components/ExportOptionsPanel";
import { GridToolBar } from "@/features/table-editor/components/GridToolBar";
import { TableEditorGrid } from "@/features/table-editor/components/TableEditorGrid";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <>
      <div>
        <h1>top page</h1>
        <div className="grid grid-cols-[1fr_auto]">
          <div>
            <GridToolBar />
            <TableEditorGrid />
          </div>
          <div>
            <ExportOptionsPanel />
            <ExportButton />
          </div>
        </div>
      </div>
      <ExportModal />
    </>
  );
}
