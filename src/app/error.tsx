"use client";

import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terjadi Kesalahan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
