import { createFileRoute } from "@tanstack/react-router";
import { Grid } from "@/features/table-editor/components/Grid";
import { GridToolBar } from "@/features/table-editor/components/GridToolBar";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div>
      <h1>top page</h1>
      <GridToolBar />
      <Grid />
    </div>
  );
}
