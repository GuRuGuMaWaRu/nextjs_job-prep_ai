import { ClerkProvider as OriginalClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <OriginalClerkProvider>{children}</OriginalClerkProvider>
    </Suspense>
  );
}
