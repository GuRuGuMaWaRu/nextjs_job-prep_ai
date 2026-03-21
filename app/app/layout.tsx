import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getCurrentUser } from "@/core/features/auth/actions";
import type { AuthUser } from "@/core/features/auth/types";
import { routes } from "@/core/data/routes";

import { CancelAtPeriodEndBanner } from "./_CancelAtPeriodEndBanner";
import { Navbar } from "./_Navbar";
import { getCanceledSubscriptionNotice } from "./_utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullScreenLoader className="m-auto h-screen" />}>
      <AuthCheckAndNavbar>{children}</AuthCheckAndNavbar>
    </Suspense>
  );
}

async function AuthCheckAndNavbar({ children }: { children: React.ReactNode }) {
  const { userId, user } = await getCurrentUser({ allData: true });

  if (userId == null || user == null) return redirect(routes.landing);

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
