import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

export function Card(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class={cn("rounded-lg border border-border bg-bg text-fg", props.class)}
    />
  );
}

export function CardHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class={cn("px-4 py-3 border-b border-border", props.class)}
    />
  );
}

export function CardTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} class={cn("text-sm font-semibold", props.class)} />;
}

export function CardContent(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} class={cn("p-4", props.class)} />;
}
