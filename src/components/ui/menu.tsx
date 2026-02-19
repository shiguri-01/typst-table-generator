import * as DropdownMenu from "@kobalte/core/dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { cn } from "@/lib/utils";

export const Menu = DropdownMenu.Root;

type MenuTriggerBaseProps = Omit<
  ComponentProps<typeof DropdownMenu.Trigger>,
  "class"
>;

interface MenuTriggerProps extends MenuTriggerBaseProps {
  class?: string;
  children?: JSX.Element;
}

export function MenuTrigger(props: MenuTriggerProps) {
  return (
    <DropdownMenu.Trigger
      {...props}
      class={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-bg text-fg outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        props.class,
      )}
    >
      {props.children}
    </DropdownMenu.Trigger>
  );
}

type MenuContentBaseProps = Omit<
  ComponentProps<typeof DropdownMenu.Content>,
  "class"
>;

interface MenuContentProps extends MenuContentBaseProps {
  class?: string;
  children?: JSX.Element;
}

export function MenuContent(props: MenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        {...props}
        class={cn(
          "z-50 min-w-48 rounded-md border border-border bg-overlay p-1 shadow-lg",
          props.class,
        )}
      >
        {props.children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

const menuItemStyles = cva(
  "flex w-full cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm text-fg outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      intent: {
        default: "",
        danger: "text-danger data-[highlighted]:bg-danger/10",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  },
);

type MenuItemBaseProps = Omit<
  ComponentProps<typeof DropdownMenu.Item>,
  "class"
>;

interface MenuItemProps
  extends MenuItemBaseProps,
    VariantProps<typeof menuItemStyles> {
  class?: string;
  children?: JSX.Element;
}

export function MenuItem(props: MenuItemProps) {
  const [local, rest] = splitProps(props, ["class", "intent", "children"]);
  return (
    <DropdownMenu.Item
      {...rest}
      class={cn(menuItemStyles({ intent: local.intent }), local.class)}
    >
      {local.children}
    </DropdownMenu.Item>
  );
}

interface MenuSectionProps {
  label: string;
  children?: JSX.Element;
}

export function MenuSection(props: MenuSectionProps) {
  return (
    <section class="py-1">
      <div class="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">
        {props.label}
      </div>
      <div class="space-y-1">{props.children}</div>
    </section>
  );
}

export function MenuSeparator(props: { class?: string }) {
  return (
    <DropdownMenu.Separator class={cn("my-1 h-px bg-border", props.class)} />
  );
}

export function MenuLabel(props: { class?: string; children?: JSX.Element }) {
  return <span class={cn("truncate", props.class)}>{props.children}</span>;
}

export function MenuDescription(props: {
  class?: string;
  children?: JSX.Element;
}) {
  return (
    <Show when={props.children}>
      <span class={cn("block text-xs text-muted-fg", props.class)}>
        {props.children}
      </span>
    </Show>
  );
}
