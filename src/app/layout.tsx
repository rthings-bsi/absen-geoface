import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Absensi - Pemerintah Kota Karawang",
  description: "Sistem Informasi Absensi Pemerintah Kota Karawang",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);

  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <SessionProvider session={session} basePath="/api/auth">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
