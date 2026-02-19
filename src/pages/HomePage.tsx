import { ExportButton } from "@/features/table-editor/components/ExportButton";
import { ExportModal } from "@/features/table-editor/components/ExportModal";
import { ExportOptionsPanel } from "@/features/table-editor/components/ExportOptionsPanel";
import { GridToolBar } from "@/features/table-editor/components/GridToolBar";
import { TableEditorGrid } from "@/features/table-editor/components/TableEditorGrid";

export function HomePage() {
  return (
    <>
      <h1 class="mb-4 text-xl font-semibold">Typst Table Generator</h1>
      <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section class="space-y-3">
          <GridToolBar />
          <TableEditorGrid />
        </section>
        <aside class="space-y-3">
          <ExportOptionsPanel />
          <ExportButton />
        </aside>
      </div>
      <ExportModal />
    </>
  );
}
