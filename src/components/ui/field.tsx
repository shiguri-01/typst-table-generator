import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

export function Label(props: JSX.LabelHTMLAttributes<HTMLLabelElement>) {
  // biome-ignore lint/a11y/noLabelWithoutControl: association is provided by callers via `for` or nesting.
  return <label {...props} class={cn("text-sm font-medium", props.class)} />;
}

export function Description(props: JSX.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} class={cn("text-xs text-muted-fg", props.class)} />;
}
