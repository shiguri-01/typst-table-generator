import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends JSX.HTMLAttributes<HTMLPreElement> {
  language?: string;
  children?: JSX.Element;
}

export function CodeBlock(props: CodeBlockProps) {
  return (
    <pre
      {...props}
      data-language={props.language}
      class={cn(
        "overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs leading-relaxed text-fg",
        props.class,
      )}
    >
      {props.children}
    </pre>
  );
}
