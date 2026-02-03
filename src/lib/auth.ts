import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";

// The two allowed emails for this private site
const ALLOWED_EMAILS = [
  process.env.ALLOWED_EMAIL_1?.toLowerCase(),
  process.env.ALLOWED_EMAIL_2?.toLowerCase(),
].filter(Boolean);

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.SITE_PASSWORD_HASH;
  if (!hash) {
    console.error("SITE_PASSWORD_HASH not configured");
    return false;
  }
  return compare(password, hash);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if user's email is on the whitelist
      return isEmailAllowed(user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        // passwordVerified starts as false, will be set to true after password gate
        token.passwordVerified = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        // Pass through the password verification status
        (session as any).passwordVerified = token.passwordVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
    error: "/rejected", // Redirect to rejection page on auth errors
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}
