import { createFileRoute } from "@tanstack/react-router";
import { TableEditorRoute } from "@/features/table-editor/route";

export const Route = createFileRoute("/")({
  component: TableEditorRoute,
});
