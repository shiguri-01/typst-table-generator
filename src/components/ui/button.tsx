import { Button as ButtonPrimitive } from "@kobalte/core/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        primary:
          "border-primary bg-primary text-primary-fg hover:bg-primary/90",
        outline: "border-border bg-bg text-fg hover:bg-muted",
        plain: "border-transparent bg-transparent text-fg hover:bg-muted",
        danger: "border-danger bg-danger text-danger-fg hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-4",
        "sq-sm": "h-8 w-8 p-0",
        "sq-md": "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  },
);

type ButtonBaseProps = Omit<ComponentProps<typeof ButtonPrimitive>, "class">;

export interface ButtonProps
  extends ButtonBaseProps,
    VariantProps<typeof buttonStyles> {
  class?: string;
  children?: JSX.Element;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "intent",
    "size",
    "children",
  ]);

  return (
    <ButtonPrimitive
      {...rest}
      class={cn(
        buttonStyles({
          intent: local.intent,
          size: local.size,
        }),
        local.class,
      )}
    >
      {local.children}
    </ButtonPrimitive>
  );
}
