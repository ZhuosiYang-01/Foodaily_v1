import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear();

  if (year === currentYear) {
    return `${month}.${day}`;
  } else {
    return `${year}.${month}.${day}`;
  }
}
