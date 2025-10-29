/** Wrap inline content with Typst italic markup. */
export const formatEmph = (content: string): string => {
  return `_${content}_`;
};

/** Wrap inline content with Typst bold markup. */
export const formatStrong = (content: string): string => {
  return `*${content}*`;
};
