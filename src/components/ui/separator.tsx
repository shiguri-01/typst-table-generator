import { Separator as SeparatorPrimitive } from "@kobalte/core/separator";
import type { ComponentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/lib/utils";

type SeparatorPrimitiveProps = Omit<
  ComponentProps<typeof SeparatorPrimitive>,
  "class"
>;

interface SeparatorProps extends SeparatorPrimitiveProps {
  class?: string;
}

export function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, ["class", "orientation"]);
  const isVertical = () => local.orientation === "vertical";

  return (
    <SeparatorPrimitive
      {...rest}
      orientation={local.orientation}
      class={cn(
        "bg-border",
        isVertical() ? "h-full w-px" : "h-px w-full",
        local.class,
      )}
    />
  );
}
