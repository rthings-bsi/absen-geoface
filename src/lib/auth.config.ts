import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Edge-safe config - NO database import
// Hanya untuk JWT validation di middleware — routing logic ada di middleware.ts
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.id_pegawai = (user as any).id_pegawai;
        token.nip = (user as any).nip;
        token.nama = (user as any).nama;
        token.role = (user as any).role;
        token.can_admin = (user as any).can_admin;
        token.permissions = (user as any).permissions;
        token.foto_profile = (user as any).foto_profile;
        token.id_role = (user as any).id_role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.id_pegawai = token.id_pegawai as number;
        session.user.email = token.email as string;
        session.user.nip = token.nip as string;
        session.user.nama = token.nama as string;
        session.user.role = token.role as string;
        session.user.can_admin = token.can_admin as boolean;
        session.user.permissions = token.permissions as string[];
        session.user.foto_profile = token.foto_profile as string | null;
        session.user.id_role = token.id_role as number | null;
      }
      return session;
    },
  },
  providers: [], // providers only needed in server context — set in auth.ts
  trustHost: true,
};

export const { auth } = NextAuth(authConfig);
