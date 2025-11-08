import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (num: number, min: number, max: number): number => {
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  return Math.min(actualMax, Math.max(actualMin, num));
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
