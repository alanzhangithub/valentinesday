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
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("something went wrong. try again?");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Character placeholder */}
        <div className="text-6xl mb-4">🔐</div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            One more step to enter the nation...
          </h1>
          <p className="text-gray-600">
            Enter the secret code known only to citizens of Meedobeedo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="enter secret code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-center text-lg"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="py-2 px-4 bg-red-50 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "checking..." : "enter meedobeedo"}
          </button>
        </form>

        <div className="pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            sign in with a different account
          </button>
        </div>

        <p className="text-xs text-gray-400 pt-4">
          hint: ask meedo or beedo, they might tell you
        </p>
      </div>
    </div>
  );
}
