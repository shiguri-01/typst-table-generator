import * as TextFieldPrimitive from "@kobalte/core/text-field";
import type { ComponentProps, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/lib/utils";

type TextFieldBaseProps = Omit<
  ComponentProps<typeof TextFieldPrimitive.Root>,
  "class"
>;

interface TextFieldProps extends TextFieldBaseProps {
  class?: string;
  children?: JSX.Element;
}

export function TextField(props: TextFieldProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <TextFieldPrimitive.Root {...rest} class={cn("grid gap-1.5", local.class)}>
      {local.children}
    </TextFieldPrimitive.Root>
  );
}
