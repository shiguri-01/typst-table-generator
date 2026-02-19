import * as SelectPrimitive from "@kobalte/core/select";
import { IconCheck, IconChevronDown } from "@tabler/icons-solidjs";
import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { cn } from "@/lib/utils";

export type SelectOption = {
  id: string;
  label: string;
  description?: JSX.Element;
};

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  "aria-label"?: string;
}

export function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, [
    "value",
    "onChange",
    "options",
    "label",
    "placeholder",
    "disabled",
    "class",
    "aria-label",
  ]);

  return (
    <SelectPrimitive.Root<SelectOption>
      {...rest}
      options={local.options}
      value={local.options.find((option) => option.id === local.value)}
      optionValue="id"
      optionTextValue="label"
      disabled={local.disabled}
      onChange={(next) => {
        if (next && !Array.isArray(next)) {
          local.onChange(next.id);
        }
      }}
      itemComponent={(props) => (
        <SelectPrimitive.Item
          item={props.item}
          class="grid cursor-default grid-cols-[1fr_auto] items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted"
        >
          <div>
            <SelectPrimitive.ItemLabel>
              {props.item.rawValue.label}
            </SelectPrimitive.ItemLabel>
            <Show when={props.item.rawValue.description}>
              <SelectPrimitive.ItemDescription class="text-xs text-muted-fg">
                {props.item.rawValue.description}
              </SelectPrimitive.ItemDescription>
            </Show>
          </div>
          <SelectPrimitive.ItemIndicator>
            <IconCheck class="h-4 w-4 text-primary" />
          </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
      )}
      class={cn("grid gap-1.5", local.class)}
    >
      <Show when={local.label}>
        <SelectPrimitive.Label class="text-sm font-medium">
          {local.label}
        </SelectPrimitive.Label>
      </Show>
      <SelectPrimitive.Trigger
        aria-label={local["aria-label"]}
        class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-bg px-3 text-sm text-fg shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring data-[placeholder-shown]:text-muted-fg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SelectPrimitive.Value<SelectOption>>
          {(state) => state.selectedOption()?.label ?? local.placeholder ?? ""}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <IconChevronDown class="h-4 w-4 text-muted-fg" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content class="z-50 min-w-[var(--kb-select-trigger-width)] rounded-md border border-border bg-overlay p-1 shadow-lg">
          <SelectPrimitive.Listbox class="max-h-64 space-y-1 overflow-auto" />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
