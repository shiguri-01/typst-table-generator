import { Input as InputPrimitive } from "@kobalte/core/text-field";
import type { ComponentProps } from "solid-js";
import { cn } from "@/lib/utils";

type InputPrimitiveProps = Omit<ComponentProps<typeof InputPrimitive>, "class">;

interface InputProps extends InputPrimitiveProps {
  class?: string;
}

export function Input(props: InputProps) {
  return (
    <InputPrimitive
      {...props}
      class={cn(
        "h-9 w-full rounded-md border border-input bg-bg px-3 text-sm text-fg shadow-xs outline-none transition-colors placeholder:text-muted-fg focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        props.class,
      )}
    />
  );
}
