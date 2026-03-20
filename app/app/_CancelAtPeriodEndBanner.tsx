"use client";

import { useState, useSyncExternalStore } from "react";
import { InfoIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";

type CancelAtPeriodEndBannerProps = {
  subscriptionId: string;
  periodEndUnix?: number | null;
};

function formatPeriodEndDate(
  periodEndUnix: number | null | undefined,
): string | null {
  if (
    periodEndUnix == null ||
    !Number.isFinite(periodEndUnix) ||
    periodEndUnix <= 0
  ) {
    return null;
  }

  return new Date(periodEndUnix * 1000).toLocaleDateString(undefined, {
    dateStyle: "long",
  });
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("cancel_at_period_end_banner-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cancel_at_period_end_banner-change", callback);
  };
}

function getSnapshot(dismissKey: string): boolean {
  return window.localStorage.getItem(dismissKey) === "1";
}

/**
 * Reminds users that canceled subscriptions remain Pro until period end.
 * The banner is dismissable per subscription cycle to reduce repeated noise.
 */
export function CancelAtPeriodEndBanner({
  subscriptionId,
  periodEndUnix,
}: CancelAtPeriodEndBannerProps) {
  const hasProperDate =
    periodEndUnix != null &&
    Number.isFinite(periodEndUnix) &&
    periodEndUnix > 0;

  const dismissSuffix = hasProperDate ? String(periodEndUnix) : "unknown";
  const dismissKey = `cancel_at_period_end_banner:${subscriptionId}:${dismissSuffix}`;

  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);

  const isPermanentlyHidden = useSyncExternalStore(
    subscribe,
    () => getSnapshot(dismissKey),
    () => true,
  );

  if (isTemporarilyHidden || isPermanentlyHidden) {
    return null;
  }

  const moveToFreeText = hasProperDate
    ? `on ${formatPeriodEndDate(periodEndUnix)}`
    : "at the end of your current billing period.";

  return (
    <div className="container py-3">
      <Alert>
        <InfoIcon />
        <div className="space-y-1">
          <AlertTitle>Subscription canceled</AlertTitle>
          <AlertDescription className="flex justify-between">
            <p>
              Your Pro plan is still active. You will move to the Free plan{" "}
              {moveToFreeText}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsTemporarilyHidden(true)}>
                Hide
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  window.localStorage.setItem(dismissKey, "1");
                  window.dispatchEvent(
                    new Event("cancel_at_period_end_banner-change"),
                  );
                }}>
                Don&apos;t show again
              </Button>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
