import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CodeBlockProps {
  /**
   * Code content to display
   */
  children: string;
  /**
   * Programming language for syntax highlighting hint
   */
  language?: string;
  /**
   * Show copy button
   * @default true
   */
  showCopy?: boolean;
  /**
   * Show language label
   * @default false
   */
  showLanguage?: boolean;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Code block component with copy functionality
 *
 * @example
 * ```tsx
 * <CodeBlock language="typescript">
 *   const hello = "world";
 * </CodeBlock>
 * ```
 */
export function CodeBlock({
  children,
  language,
  showCopy = true,
  showLanguage = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="relative rounded-lg">
      {/* Language label (optional) */}
      {showLanguage && language && (
        <div className="border-b border-border bg-muted px-4 py-2">
          <span className="font-mono text-muted-fg text-xs uppercase">
            {language}
          </span>
        </div>
      )}

      {/* Copy button floating on top right */}
      {showCopy && (
        <Button
          size="sq-sm"
          intent="plain"
          onPress={handleCopy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          className="absolute top-2 right-3 z-10"
        >
          {copied ? (
            <IconCheck className="size-4" />
          ) : (
            <IconCopy className="size-4" />
          )}
        </Button>
      )}

      {/* Code content */}
      <pre
        className={cn(
          "overflow-auto rounded-md bg-muted p-4 pr-12 font-mono text-sm",
          className,
        )}
      >
        <code className="text-fg">{children}</code>
      </pre>
    </div>
  );
}
