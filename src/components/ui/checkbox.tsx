import * as CheckboxPrimitive from "@kobalte/core/checkbox";
import { IconCheck } from "@tabler/icons-solidjs";
import type { ComponentProps, JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { cn } from "@/lib/utils";

type CheckboxBaseProps = Omit<
  ComponentProps<typeof CheckboxPrimitive.Root>,
  "class"
>;

interface CheckboxProps extends CheckboxBaseProps {
  class?: string;
  children?: JSX.Element;
}

export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <CheckboxPrimitive.Root
      {...rest}
      class={cn("flex items-start gap-2 text-sm text-fg", local.class)}
    >
      <CheckboxPrimitive.Input />
      <CheckboxPrimitive.Control class="mt-0.5 flex h-4 w-4 items-center justify-center rounded border border-input bg-bg data-[checked]:border-primary data-[checked]:bg-primary">
        <CheckboxPrimitive.Indicator>
          <IconCheck class="h-3 w-3 text-primary-fg" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
      <Show when={local.children}>
        <CheckboxPrimitive.Label class="space-y-1">
          {local.children}
        </CheckboxPrimitive.Label>
      </Show>
    </CheckboxPrimitive.Root>
  );
}
