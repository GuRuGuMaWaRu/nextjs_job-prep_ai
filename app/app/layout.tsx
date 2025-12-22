import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getCurrentUser } from "@/core/features/auth/server";
import { routes } from "@/core/data/routes";

import { Navbar } from "./_Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullScreenLoader className="m-auto h-screen" />}>
      <AuthCheckAndNavbar>{children}</AuthCheckAndNavbar>
    </Suspense>
  );
}

async function AuthCheckAndNavbar({ children }: { children: React.ReactNode }) {
  const { userId, user } = await getCurrentUser({ allData: true });

  if (userId == null) return redirect(routes.landing);
  if (user == null) return redirect(routes.onboarding);

  return (
    <>
      <Navbar user={user} />
      {children}
    </>
  );
}
