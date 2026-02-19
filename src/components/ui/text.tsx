import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

export function Text(props: JSX.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} class={cn("text-sm text-fg", props.class)} />;
}
