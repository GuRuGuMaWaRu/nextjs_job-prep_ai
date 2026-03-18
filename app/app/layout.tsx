import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { getCurrentUser } from "@/core/features/auth/actions";
import { routes } from "@/core/data/routes";
import { getStripe } from "@/core/lib/stripe";

import { CancelAtPeriodEndBanner } from "./_CancelAtPeriodEndBanner";
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

type AuthenticatedUser = {
  plan: string;
  stripeSubscriptionId: string | null;
};

type CanceledSubscriptionNotice = {
  subscriptionId: string;
  periodEndUnix: number | null;
};

async function getCanceledSubscriptionNotice(
  user: AuthenticatedUser,
): Promise<CanceledSubscriptionNotice | null> {
  if (user.plan !== "pro") return null;
  if (!user.stripeSubscriptionId) return null;

  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );

    if (!subscription.cancel_at_period_end) return null;

    const hasValidPeriodEnd =
      Number.isFinite(subscription.cancel_at) && subscription.cancel_at != null && subscription.cancel_at > 0;
    const periodEndUnix = hasValidPeriodEnd ? subscription.cancel_at : null;

    if (periodEndUnix != null) {
      const nowUnix = Math.floor(Date.now() / 1000);
      if (periodEndUnix <= nowUnix) return null;
    }

    return {
      subscriptionId: subscription.id,
      periodEndUnix,
    };
  } catch {
    return null;
  }
}