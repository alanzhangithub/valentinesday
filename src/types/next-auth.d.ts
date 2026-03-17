import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    passwordVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string | null;
    passwordVerified?: boolean;
  }
}
