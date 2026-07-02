import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, pegawai, roles, role_permission, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface User {
    id_pegawai: number;
    nip: string;
    nama: string;
    role: string;
    can_admin: boolean;
    permissions: string[];
    foto_profile: string | null;
    id_role: number | null;
  }
  interface Session {
    user: {
      id: string;
      id_pegawai: number;
      email: string;
      nip: string;
      nama: string;
      role: string;
      can_admin: boolean;
      permissions: string[];
      foto_profile: string | null;
      id_role: number | null;
    };
  }
}

// SINGLE auth config - digunakan oleh middleware DAN route handlers
const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 Jam aja (3600 detik) - Setelah ini dipaksa logout
    updateAge: 15 * 60, // Update token tiap 15 menit kalau user aktif
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
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
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const email = credentials.email as string;
          const password = credentials.password as string;

          const user = await db.query.users.findFirst({ where: eq(users.email, email) });
          if (!user || !user.is_active) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          const pegawaiRecord = await db.query.pegawai.findFirst({ where: eq(pegawai.id_user, user.id) });
          if (!pegawaiRecord) return null;

          // Check admin status: role-based (via id_role) OR legacy role field
          let can_admin = false;
          let rolePerms: string[] = [];

          if (pegawaiRecord.id_role) {
            const role = await db.query.roles.findFirst({ where: eq(roles.id, pegawaiRecord.id_role) });
            if (role) {
              can_admin = role.can_admin;
              const rp = await db
                .select({ perm: permissions.nama })
                .from(role_permission)
                .innerJoin(permissions, eq(role_permission.id_permission, permissions.id))
                .where(eq(role_permission.id_role, role.id));
              rolePerms = rp.map((r: any) => r.perm);
            }
          }

          // Legacy fallback: if role field is "Admin", grant admin access
          if (!can_admin && pegawaiRecord.role === "Admin") {
            can_admin = true;
          }

          if (can_admin) {
            const allPerms = await db.select().from(permissions);
            rolePerms = allPerms.map((p: any) => p.nama);
          }

          return {
            id: String(user.id), id_pegawai: pegawaiRecord.id, email: user.email,
            nip: pegawaiRecord.nip, nama: pegawaiRecord.nama, role: pegawaiRecord.role,
            can_admin, permissions: rolePerms, foto_profile: pegawaiRecord.foto_profile,
            id_role: pegawaiRecord.id_role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
