import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined | null, formatStr: string = "MMM d, yyyy") {
  if (!date) return 'Recently';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Recently';
    return format(d, formatStr);
  } catch {
    return 'Recently';
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  if (confidence >= 70) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  if (confidence >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  return "text-red-500 bg-red-500/10 border-red-500/20";
}

export function getHallucinationStatus(status: string): { label: string; color: string; icon: string } {
  switch (status) {
    case 'verified':
      return { label: 'Verified', color: 'text-emerald-500', icon: 'check-circle' };
    case 'high_confidence':
      return { label: 'High Confidence', color: 'text-blue-500', icon: 'shield-check' };
    case 'medium':
      return { label: 'Medium Confidence', color: 'text-amber-500', icon: 'info' };
    case 'possible_hallucination':
      return { label: 'Possible Hallucination', color: 'text-red-500', icon: 'alert-triangle' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', icon: 'help-circle' };
  }
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy: ", err);
    return false;
  }
}
