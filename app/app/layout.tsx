import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getCurrentUser } from "@/core/features/auth/actions";
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

  const canceledSubscriptionNotice = await getCanceledSubscriptionNotice(user);

  return (
    <>
      <Navbar user={user} />
      {canceledSubscriptionNotice ? (
        <CancelAtPeriodEndBanner
          subscriptionId={canceledSubscriptionNotice.subscriptionId}
          periodEndUnix={canceledSubscriptionNotice.periodEndUnix}
        />
      ) : null}
      {children}
    </>
  );
}
