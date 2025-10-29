/**
 * Figure wrapper utilities for Typst.
 *
 * Provides a typed option bag and a helper to wrap arbitrary Typst content
 * with a multi-line `figure(...)` call.
 */
import { formatFunction } from "./utils/format";

/** Options for Typst `figure(...)`. */
export type FigureOption = {
  caption?: string;
  ref?: string;
};

/** Default empty figure options. */
export const DEFAULT_FIGURE_OPTION: FigureOption = {} as const;

/**
 * Render a `figure(...)` call that wraps a Typst expression.
 *
 * @param content - A valid Typst expression string (e.g. a `table(...)`).
 * @param options - Figure options (caption/ref). The current implementation
 *   excludes `ref` from named args; callers may handle it separately.
 * @returns The rendered Typst `figure(...)` string.
 */
export const renderFigure = (
  content: string,
  options: FigureOption = DEFAULT_FIGURE_OPTION,
): string => {
  // ref以外
  const namedArgs = Object.entries(options).reduce(
    (acc, [key, value]) => {
      if (key !== "ref") {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const figure = formatFunction(
    {
      name: "figure",
      args: { unnamed: content, named: namedArgs },
    },
    {
      multipleLine: true,
    },
  );

  const { ref } = options;
  if (ref !== undefined) {
    return `${figure}<${ref}>`;
  }
  return figure;
};
