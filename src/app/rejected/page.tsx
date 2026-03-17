"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function RejectedPage() {
  const [applied, setApplied] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="text-8xl mb-4">🚫</div>

        <h1 className="font-heading text-3xl font-semibold text-foreground">
          this nation is closed to outsiders
        </h1>

        <p className="text-lg text-muted-foreground font-body">
          you are not authorized to enter meedobeedo.
        </p>

        <p className="text-sm text-muted-foreground font-body">
          the borders are sealed. the gates are locked. the meedo guards are
          watching. this is a nation of two, and you are not one of them.
        </p>

        <div className="pt-4 space-y-3">
          {!applied ? (
            <button
              onClick={() => setApplied(true)}
              className="w-full py-3 px-4 bg-white hover:bg-muted text-foreground rounded-2xl font-heading font-semibold transition-colors shadow-sm border-2 border-border"
            >
              apply for citizenship 📝
            </button>
          ) : (
            <div className="py-3 px-4 bg-candy-pink/10 text-candy-pink rounded-2xl font-body font-semibold">
              application denied. immigration is permanently closed. 💀
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full py-3 px-4 bg-foreground hover:bg-foreground/90 text-white rounded-2xl font-heading font-semibold transition-colors shadow-md"
          >
            leave 👋
          </button>
        </div>

        <p className="text-xs text-muted-foreground pt-8 font-body">
          — the department of meedobeedo border control
        </p>
      </div>
    </div>
  );
}
