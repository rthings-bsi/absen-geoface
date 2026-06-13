import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      </div>
    </div>
  );
}
