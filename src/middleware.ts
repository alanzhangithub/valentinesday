import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require any authentication
const publicPaths = [
  "/api/auth",
  "/rejected",
  "/_next",
  "/favicon.ico",
];

// Routes that require OAuth but not password verification
const authOnlyPaths = [
  "/password-gate",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

function isAuthOnlyPath(pathname: string): boolean {
  return authOnlyPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths (auth endpoints, rejected page, static files)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for NextAuth session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No token = not logged in with Google
  if (!token) {
    // Redirect to Google OAuth
    const signInUrl = new URL("/api/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Token exists but email not allowed = redirect to rejection
  // This shouldn't normally happen since signIn callback blocks it,
  // but it's a safety check
  const allowedEmails = [
    process.env.ALLOWED_EMAIL_1?.toLowerCase(),
    process.env.ALLOWED_EMAIL_2?.toLowerCase(),
  ].filter(Boolean);

  if (token.email && !allowedEmails.includes(token.email.toLowerCase())) {
    return NextResponse.redirect(new URL("/rejected", request.url));
  }

  // For auth-only paths (like password-gate), just check OAuth
  if (isAuthOnlyPath(pathname)) {
    return NextResponse.next();
  }

  // For all other protected routes, check password verification cookie
  const passwordVerified = request.cookies.get("password-verified")?.value === "true";

  if (!passwordVerified) {
    return NextResponse.redirect(new URL("/password-gate", request.url));
  }

  // All checks passed - allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public files (favicon.ico, etc)
     */
    "/((?!_next/static|_next/image|.*\\..*|favicon.ico).*)",
  ],
};
