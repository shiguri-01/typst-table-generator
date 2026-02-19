import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

export function Code(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <code
      {...props}
      class={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-fg",
        props.class,
      )}
    />
  );
}
