import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export date formatting utilities
export { formatDate, formatDateShort, formatDateTime, getRelativeTime } from './utils/formatDate';