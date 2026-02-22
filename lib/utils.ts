import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deterministic date formatter to avoid SSR/CSR locale differences
// Accepts ISO-like date strings (e.g., "2024-01-15" or full ISO) and returns dd/mm/yyyy
export function formatISODateDDMMYYYY(input?: string) {
  if (!input) return "";
  // Extract date portion if full ISO is provided
  const isoDate = input.includes("T") ? input.split("T")[0] : input;
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate; // fallback to original if unexpected
  const [y, m, d] = parts;
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}
