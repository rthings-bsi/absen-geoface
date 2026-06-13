import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto">
          <FileQuestion className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
