import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

interface ButtonGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: JSX.Element;
}

export function ButtonGroup(props: ButtonGroupProps) {
  return (
    <div
      {...props}
      role={props.role ?? "group"}
      class={cn("inline-flex items-center gap-2", props.class)}
    >
      {props.children}
    </div>
  );
}
