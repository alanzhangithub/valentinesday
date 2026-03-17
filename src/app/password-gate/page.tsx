"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function PasswordGatePage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "nice try, but that's not it");
        setLoading(false);
        return;
      }

      // Success - redirect to home
      window.location.href = "/";
    } catch {
      setError("something went wrong. try again?");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="text-6xl mb-4">🔐</div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            one more step to enter the nation...
          </h1>
          <p className="text-muted-foreground font-body">
            enter the secret code known only to citizens of meedobeedo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="enter secret code"
              className="w-full px-4 py-3 bg-white border-2 border-candy-sky/30 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-center text-lg font-body"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="py-2 px-4 bg-candy-pink/10 text-candy-pink rounded-2xl text-sm font-body font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-heading font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "checking..." : "enter meedobeedo 🚪"}
          </button>
        </form>

        <div className="pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-muted-foreground hover:text-foreground underline font-body"
          >
            sign in with a different account
          </button>
        </div>

        <p className="text-xs text-muted-foreground pt-4 font-body">
          hint: ask meedo or beedo, they might tell you 🤫
        </p>
      </div>
    </div>
  );
}
