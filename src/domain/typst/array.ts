import { ESCAPE_CHARS, escapeSet } from "./utils/format";

export const formatArray = (items: string[]): string =>
  `(${items.map((item) => escapeSet(item, ESCAPE_CHARS).trim()).join(", ")})`;
