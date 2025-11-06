import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export function Text({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={twMerge("text-base/6 text-muted-fg sm:text-sm/6", className)}
    />
  );
}
