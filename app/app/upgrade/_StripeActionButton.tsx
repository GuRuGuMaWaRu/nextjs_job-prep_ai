"use client";

import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { Button } from "@/core/components/ui/button";
import { routes } from "@/core/data/routes";

type StripeAction = "checkout" | "portal" | "cancel";

type StripeActionButtonProps = {
  action: StripeAction;
  url: string;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  disabled?: boolean;
  pendingLabel?: string;
};

const STORAGE_KEY_PREFIX = "stripe_idempotency_";

function getStorageKey(action: StripeAction): string {
  return `${STORAGE_KEY_PREFIX}${action}`;
}

function getOrCreateIdempotencyKey(storageKey: string): string {
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const next = crypto.randomUUID();
  sessionStorage.setItem(storageKey, next);
  return next;
}

async function getRedirectTarget(response: Response): Promise<string | null> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) return null;

  const payload = (await response.json()) as { redirectUrl?: unknown } | null;
  return typeof payload?.redirectUrl === "string" ? payload.redirectUrl : null;
}

function shouldClearIdempotencyKey(redirectTarget: string): boolean {
  try {
    const parsed = new URL(redirectTarget, window.location.origin);

    if (parsed.hostname.endsWith("stripe.com")) return true;
    if (parsed.pathname !== routes.upgrade) return false;

    if (parsed.searchParams.get("success") === "true") return true;
    if (parsed.searchParams.get("canceled") === "true") return true;
    if (parsed.searchParams.get("canceled_subscription") === "true") return true;

    return false;
  } catch {
    return false;
  }
}

export function StripeActionButton({
  action,
  url,
  children,
  className,
  buttonClassName,
  variant = "default",
  size = "default",
  disabled = false,
  pendingLabel = "Processing...",
}: StripeActionButtonProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storageKey = getStorageKey(action);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || disabled) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const idempotencyKey = getOrCreateIdempotencyKey(storageKey);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey }),
      });

      const redirectTarget = await getRedirectTarget(response);
      if (!redirectTarget) {
        throw new Error("Expected redirect response.");
      }

      if (shouldClearIdempotencyKey(redirectTarget)) {
        sessionStorage.removeItem(storageKey);
      }

      window.location.assign(redirectTarget);
      return;
    } catch {
      setErrorMessage("Could not complete billing action. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={buttonClassName}
        disabled={disabled || isSubmitting}>
        {isSubmitting ? pendingLabel : children}
      </Button>
      {errorMessage && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
