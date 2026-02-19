import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

export function Container(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", props.class)}
    />
  );
}
