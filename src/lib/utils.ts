import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null, format: "short" | "long" | "time" | "datetime" = "short"): string {
  if (!date) return "-";
  const d = new Date(date);
  switch (format) {
    case "short":
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    case "long":
      return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    case "time":
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    case "datetime":
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
