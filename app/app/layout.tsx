import { Suspense } from "react";
import { redirect } from "next/navigation";

import { routes } from "@/core/data/routes";
import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getCurrentUser } from "@/core/lib/getCurrentUser";
import type { AuthUser } from "@/core/features/auth/types";

import { CancelAtPeriodEndBanner } from "./_CancelAtPeriodEndBanner";
import { Navbar } from "./_Navbar";
import { getCanceledSubscriptionNotice } from "./_utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullScreenLoader className="m-auto h-screen" />}>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </Suspense>
  );
}

async function AuthenticatedAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user == null) {
    return redirect(routes.api.evictSession);
  }

  return (
    <>
      <Navbar user={user} />
      <Suspense fallback={null}>
        <BannerWrapper user={user} />
      </Suspense>
      {children}
    </>
  );
}

async function BannerWrapper({ user }: { user: AuthUser }) {
  const canceledSubscriptionNotice = await getCanceledSubscriptionNotice(user);

  if (!canceledSubscriptionNotice) return null;

  return (
    <CancelAtPeriodEndBanner
      subscriptionId={canceledSubscriptionNotice.subscriptionId}
      periodEndUnix={canceledSubscriptionNotice.periodEndUnix}
    />
  );
}
