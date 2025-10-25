"use client";

import type { ToOptions } from "@tanstack/react-router";
import {
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { cx } from "@/lib/primitive";

const linkStyles = tv({
  base: [
    "font-medium text-fg",
    "outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring forced-colors:outline-[Highlight]",
    "disabled:cursor-default disabled:text-muted-fg forced-colors:disabled:text-[GrayText]",
  ],
  variants: {
    enabled: {
      true: "cursor-pointer",
    },
  },
});

interface LinkProps extends Omit<LinkPrimitiveProps, "href"> {
  ref?: React.RefObject<HTMLAnchorElement>;
  to: ToOptions["to"];
}

const Link = ({ to, className, ref, ...props }: LinkProps) => {
  return (
    <LinkPrimitive
      href={to}
      ref={ref}
      className={cx(linkStyles({ enabled: Boolean(to) }), className)}
      {...props}
    />
  );
};

interface ExternalLinkProps extends Omit<LinkPrimitiveProps, "target" | "rel"> {
  ref?: React.RefObject<HTMLAnchorElement>;
  newTab?: boolean;
}

const ExternalLink = ({
  href,
  className,
  ref,
  newTab = true,
  ...props
}: ExternalLinkProps) => {
  return (
    <LinkPrimitive
      href={href}
      ref={ref}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={cx(linkStyles({ enabled: Boolean(href) }), className)}
      {...props}
    />
  );
};

export type { LinkProps, ExternalLinkProps };
export { Link, ExternalLink };
