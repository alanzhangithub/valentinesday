"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function RejectedPage() {
  const [applied, setApplied] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Sad character placeholder */}
        <div className="text-8xl mb-4">🚫</div>

        <h1 className="text-3xl font-bold text-gray-900">
          This Nation is Closed to Outsiders
        </h1>

        <p className="text-lg text-gray-600">
          You are not authorized to enter Meedobeedo.
        </p>

        <p className="text-sm text-gray-500">
          The borders are sealed. The gates are locked. The Meedo guards are
          watching. This is a nation of two, and you are not one of them.
        </p>

        <div className="pt-4 space-y-3">
          {!applied ? (
            <button
              onClick={() => setApplied(true)}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              Apply for Citizenship
            </button>
          ) : (
            <div className="py-3 px-4 bg-red-50 text-red-800 rounded-lg">
              Application denied. Immigration is permanently closed.
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            Leave
          </button>
        </div>

        <p className="text-xs text-gray-400 pt-8">
          — The Department of Meedobeedo Border Control
        </p>
      </div>
    </div>
  );
}
