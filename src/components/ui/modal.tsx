import * as Dialog from "@kobalte/core/dialog";
import { IconX } from "@tabler/icons-solidjs";
import type { JSX } from "solid-js";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: JSX.Element;
}

export function Modal(props: ModalProps) {
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.children}
    </Dialog.Root>
  );
}

interface ModalContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: "md" | "4xl";
  children?: JSX.Element;
}

export function ModalContent(props: ModalContentProps) {
  const maxWidth = () => (props.size === "4xl" ? "max-w-4xl" : "max-w-lg");

  return (
    <Dialog.Portal>
      <Dialog.Overlay class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />
      <Dialog.Content
        class={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-overlay p-4 shadow-xl",
          maxWidth(),
          props.class,
        )}
      >
        <Dialog.CloseButton
          aria-label="Close dialog"
          class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-fg"
        >
          <IconX class="h-4 w-4" />
        </Dialog.CloseButton>
        {props.children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function ModalHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} class={cn("mb-4", props.class)} />;
}

export function ModalTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Dialog.Title {...props} class={cn("text-lg font-semibold", props.class)} />
  );
}

export function ModalBody(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} class={cn("space-y-4", props.class)} />;
}

export function ModalFooter(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class={cn("mt-4 flex items-center justify-end gap-2", props.class)}
    />
  );
}

export function ModalClose(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Dialog.CloseButton
      {...props}
      class={cn(
        "inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm hover:bg-muted",
        props.class,
      )}
    >
      {props.children ?? "Close"}
    </Dialog.CloseButton>
  );
}
