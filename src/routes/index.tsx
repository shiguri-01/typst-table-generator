import { createFileRoute } from "@tanstack/react-router";
import { GridToolBar } from "@/features/table-editor/components/GridToolBar";
import { TableEditorGrid } from "@/features/table-editor/components/TableEditorGrid";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div>
      <h1>top page</h1>
      <GridToolBar />
      <TableEditorGrid />
    </div>
  );
}
