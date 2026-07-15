"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { revalidateUpgradePage } from "./actions";

type Props = {
  success: boolean;
  canceled: boolean;
  canceledSubscription: boolean;
  subscriptionChanged: boolean;
};

/**
 * When the user lands on the upgrade page after Stripe (success, canceled, or
 * canceled subscription), or lazy reconciliation changed their subscription,
 * runs revalidation then refreshes so the page shows fresh plan data.
 * Revalidation must not run during render.
 */
export function RevalidateOnStripeReturn({
  success,
  canceled,
  canceledSubscription,
  subscriptionChanged,
}: Props) {
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (
      !success &&
      !canceled &&
      !canceledSubscription &&
      !subscriptionChanged
    ) {
      return;
    }

    if (didRun.current) return;
    didRun.current = true;

    revalidateUpgradePage()
      .catch((err: unknown) => {
        console.error("revalidateUpgradePage failed:", err);
      })
      .finally(() => {
        router.refresh();
      });
  }, [success, canceled, canceledSubscription, subscriptionChanged, router]);

  return null;
}
