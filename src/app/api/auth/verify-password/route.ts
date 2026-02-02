import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: "nice try, but that's not it" },
        { status: 401 }
      );
    }

    // Password is correct - set a cookie to track this
    const response = NextResponse.json({ success: true });

    // Set a secure cookie that indicates password was verified
    // This will be checked by middleware
    response.cookies.set("password-verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days, matches session
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
