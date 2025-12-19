"use client";

import { useEffect } from "react";

import { Button } from "@/core/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-5xl flex flex-col items-center justify-center h-screen-header gap-4">
      <h2>Something went wrong!</h2>
      <pre className="text-red-500 whitespace-pre-wrap">{error.message}</pre>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
