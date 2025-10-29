import { formatFunction } from "./utils/format";

export type FigureOption = {
  caption?: string;
  ref?: string;
};

export const DEFAULT_FIGURE_OPTION: FigureOption = {} as const;

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
  if (ref === undefined) {
    return `${figure}<${ref}>`;
  }
  return figure;
};
