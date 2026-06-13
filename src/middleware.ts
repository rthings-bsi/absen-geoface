import { auth } from "@/lib/auth.config";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const { pathname } = nextUrl;
  const isLoggedIn = !!session?.user;

  // Public routes
  if (pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/uploads") ||
      pathname.startsWith("/favicon")) {
    return;
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Redirect non-admin users away from admin routes
  if (pathname.startsWith("/admin") && !session?.user?.can_admin) {
    return Response.redirect(new URL("/pegawai/dashboard", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
