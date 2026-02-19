import { ToggleButton as ToggleButtonPrimitive } from "@kobalte/core/toggle-button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/lib/utils";

const toggleStyles = cva(
  "inline-flex items-center justify-center rounded-md border border-border bg-bg text-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[pressed]:border-primary data-[pressed]:bg-primary data-[pressed]:text-primary-fg",
  {
    variants: {
      size: {
        sm: "h-8 px-3",
        "sq-sm": "h-8 w-8 p-0",
      },
      intent: {
        plain: "hover:bg-muted",
      },
    },
    defaultVariants: {
      size: "sq-sm",
      intent: "plain",
    },
  },
);

type ToggleBaseProps = Omit<
  ComponentProps<typeof ToggleButtonPrimitive>,
  "class"
>;

interface ToggleProps
  extends ToggleBaseProps,
    VariantProps<typeof toggleStyles> {
  class?: string;
  children?: JSX.Element;
}

export function Toggle(props: ToggleProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "size",
    "intent",
    "children",
  ]);

  return (
    <ToggleButtonPrimitive
      {...rest}
      class={cn(
        toggleStyles({
          size: local.size,
          intent: local.intent,
        }),
        local.class,
      )}
    >
      {local.children}
    </ToggleButtonPrimitive>
  );
}
