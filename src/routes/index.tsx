import { createFileRoute } from "@tanstack/react-router";
import { Grid } from "@/features/table-editor/components/Grid";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div>
      <h1>top page</h1>
      <Grid />
    </div>
  );
}
