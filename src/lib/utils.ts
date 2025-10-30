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
