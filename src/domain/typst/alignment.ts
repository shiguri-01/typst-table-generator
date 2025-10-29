export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "horizon" | "bottom";

export type Align = {
  horizontal?: HorizontalAlign;
  vertical?: VerticalAlign;
};

export const DEFAULT_ALIGN: Align = {} as const;
export const ALIGN_AUTO = "auto";

export const formatAlign = (align: Align): string => {
  if (align.horizontal && align.vertical) {
    return `${align.horizontal} + ${align.vertical}`;
  }
  return align.horizontal ?? align.vertical ?? ALIGN_AUTO;
};
