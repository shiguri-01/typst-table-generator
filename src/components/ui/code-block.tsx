import { IconCheck, IconCopy, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { cn, copyToClipboard } from "@/lib/utils";
import { Button } from "./button";

// Timeout duration for showing the "copied" state
const COPIED_STATE_TIMEOUT_MS = 3000;

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
  const [error, setError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async () => {
    // Clear any existing timeout to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset both states
    setError(false);
    setCopied(false);

    // Attempt to copy to clipboard
    const success = await copyToClipboard(children);

    if (success) {
      setCopied(true);
      // Set timeout to reset copied state
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, COPIED_STATE_TIMEOUT_MS);
    } else {
      // Show error state briefly
      setError(true);
      timeoutRef.current = setTimeout(() => {
        setError(false);
        timeoutRef.current = null;
      }, COPIED_STATE_TIMEOUT_MS);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
          aria-label={
            copied ? "Copied" : error ? "Copy failed" : "Copy to clipboard"
          }
          className="absolute top-2 right-3 z-10"
        >
          {copied ? (
            <IconCheck className="size-4" />
          ) : error ? (
            <IconX className="size-4 text-danger" />
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
