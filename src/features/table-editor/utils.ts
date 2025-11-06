import type { CellPosition } from "@/domain/typst/table/table";

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

/**
 * Safely copy text to clipboard with error handling
 * @param text Text to copy
 * @returns Promise that resolves to true on success, false on failure
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Check if clipboard API is available
  if (!navigator.clipboard) {
    console.error("Clipboard API is not available");
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
