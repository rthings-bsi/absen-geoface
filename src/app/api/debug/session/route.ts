import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * DEBUG ENDPOINT - Remove in production
 * Endpoint untuk debug session data saat development
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "No session found"
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user?.id,
        email: session.user?.email,
        nama: session.user?.nama,
        nip: session.user?.nip,
        role: session.user?.role,
        can_admin: session.user?.can_admin,
        id_role: session.user?.id_role,
        permissions: session.user?.permissions,
      },
      message: `User ${session.user?.nama} logged in. can_admin: ${session.user?.can_admin}`,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      message: "Debug session check failed"
    }, { status: 500 });
  }
}
