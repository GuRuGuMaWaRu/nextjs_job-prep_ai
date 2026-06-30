import { Check } from "lucide-react";

import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/core/components/ui/card";
import { getUserSubscriptionInfo } from "@/core/features/auth/permissions";
import { isStripeConfigured } from "@/core/features/billing/stripe";
import { FREE_PLAN_CARD, PRO_PLAN_CARD } from "@/core/features/billing/plans";

import { StripeActionButton } from "./_StripeActionButton";

const STRIPE_CHECKOUT_URL = "/api/stripe/create-checkout-session";
const STRIPE_PORTAL_URL = "/api/stripe/create-portal-session";
const STRIPE_CANCEL_SUBSCRIPTION_URL = "/api/stripe/cancel-subscription";

function PlanCard({
  plan,
  isCurrentPlan,
  cta,
  ctaDisabled,
  canUpgrade,
  stripeCheckoutEnabled,
  checkoutAction,
  cancelAction,
}: {
  plan: typeof FREE_PLAN_CARD | typeof PRO_PLAN_CARD;
  isCurrentPlan: boolean;
  cta: string;
  ctaDisabled: boolean;
  canUpgrade?: boolean;
  stripeCheckoutEnabled?: boolean;
  checkoutAction?: string;
  cancelAction?: string;
}) {
  const showBadges = plan.popular || isCurrentPlan;
  const useStripeCheckout =
    canUpgrade && stripeCheckoutEnabled && checkoutAction;

  return (
    <Card
      className={`relative transition-all hover:shadow-lg ${
        plan.popular ? "border-primary shadow-lg" : ""
      } ${isCurrentPlan ? "ring-2 ring-primary/30" : ""}`}
      aria-label={isCurrentPlan ? `Current plan: ${plan.name}` : undefined}
    >
      {showBadges && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2">
          {plan.popular && (
            <Badge className="px-2 py-0.5 text-xs font-semibold">
              Most Popular
            </Badge>
          )}
          {isCurrentPlan && (
            <Badge variant="secondary" className="text-xs font-semibold">
              Your plan
            </Badge>
          )}
        </div>
      )}
      <CardHeader className="space-y-4 p-5">
        <div className="space-y-1">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <CardDescription className="text-sm">
            {plan.description}
          </CardDescription>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight">
            {plan.price}
          </span>
          <span className="text-xs text-muted-foreground">{plan.period}</span>
        </div>
        <div className="space-y-2 pt-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardFooter className="pt-0 px-5 mt-auto">
        {useStripeCheckout ? (
          <StripeActionButton
            action="checkout"
            url={checkoutAction}
            className="w-full"
            size="lg"
            buttonClassName="w-full"
            pendingLabel="Starting checkout..."
          >
            {cta}
          </StripeActionButton>
        ) : cancelAction ? (
          <StripeActionButton
            action="cancel"
            url={cancelAction}
            className="w-full"
            variant="outline"
            size="lg"
            buttonClassName="w-full"
            pendingLabel="Canceling..."
          >
            {cta}
          </StripeActionButton>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={ctaDisabled}
            variant={ctaDisabled ? "outline" : "default"}
          >
            {cta}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export async function PlanCardsSection() {
  const { plan: currentPlan, hasExistingSubscription } =
    await getUserSubscriptionInfo();
  const stripeEnabled = isStripeConfigured();
  const showManagement = hasExistingSubscription && stripeEnabled;
  const canCheckout =
    currentPlan !== "pro" && !hasExistingSubscription && stripeEnabled;

  return (
    <section className="space-y-8">
      {hasExistingSubscription && currentPlan !== "pro" && (
        <div
          className="max-w-4xl mx-auto rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-800 dark:text-amber-200"
          role="alert"
        >
          Your subscription payment needs attention. Use{" "}
          <strong>Manage subscription</strong> below to update your payment
          method.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PlanCard
          plan={FREE_PLAN_CARD}
          isCurrentPlan={currentPlan === "free" && !hasExistingSubscription}
          cta={
            currentPlan === "free" && !hasExistingSubscription
              ? "Current plan"
              : "Switch to Free"
          }
          ctaDisabled={
            (currentPlan === "free" && !hasExistingSubscription) ||
            (currentPlan === "pro" && !hasExistingSubscription)
          }
          cancelAction={
            hasExistingSubscription && stripeEnabled
              ? STRIPE_CANCEL_SUBSCRIPTION_URL
              : undefined
          }
        />
        <PlanCard
          plan={PRO_PLAN_CARD}
          isCurrentPlan={currentPlan === "pro"}
          cta={currentPlan === "pro" ? "Current plan" : "Upgrade to Pro"}
          ctaDisabled={!canCheckout}
          canUpgrade={canCheckout}
          stripeCheckoutEnabled={canCheckout}
          checkoutAction={STRIPE_CHECKOUT_URL}
        />
      </div>

      {showManagement && (
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          <StripeActionButton
            action="portal"
            url={STRIPE_PORTAL_URL}
            variant="outline"
            size="sm"
            pendingLabel="Opening portal..."
          >
            Manage subscription
          </StripeActionButton>
          <StripeActionButton
            action="cancel"
            url={STRIPE_CANCEL_SUBSCRIPTION_URL}
            variant="ghost"
            size="sm"
            buttonClassName="text-muted-foreground hover:text-destructive"
            pendingLabel="Canceling..."
          >
            Cancel subscription
          </StripeActionButton>
        </div>
      )}
    </section>
  );
}
