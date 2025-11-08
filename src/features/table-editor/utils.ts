import type { CellPosition } from "@/domain/typst/table/table";
import { copyToClipboard } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const createColumnTitle = (index: number) => {
  let title = "";
  let n = index;
  while (n >= 0) {
    title = ALPHABET[n % ALPHABET.length] + title;
    n = Math.floor(n / ALPHABET.length) - 1;
  }
  return title;
};

export const createRowTitle = (index: number) => `${index + 1}`;

export const cellName = ({ row, column }: CellPosition) => {
  return `${createColumnTitle(column)}${createRowTitle(row)}`;
};

// Re-export copyToClipboard for backward compatibility
export { copyToClipboard };
