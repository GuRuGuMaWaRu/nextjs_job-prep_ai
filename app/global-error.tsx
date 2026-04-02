"use client";

import { useEffect } from "react";
import { Outfit } from "next/font/google";

import { Button } from "@/core/components/ui/button";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

/**
 * Catches errors in the root layout. `app/error.tsx` does not — it only wraps
 * children below the root layout. This file must define `<html>` and `<body>`
 * because it replaces the root layout when active.
 *
 * In production, Next passes `reset` so the boundary can retry. In development,
 * the dev overlay may render this component with only `error`; then we fall
 * back to a full reload.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const recover = () => {
    if (typeof reset === "function") {
      reset();
      return;
    }
    window.location.reload();
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased font-sans`}>
        <div className="container max-w-5xl mx-auto px-4 flex flex-col items-center justify-center min-h-screen gap-4">
          <h2>Something went wrong! (Global Error)</h2>
          <pre className="text-red-500 whitespace-pre-wrap">
            {error.message}
          </pre>
          <Button type="button" onClick={recover}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
