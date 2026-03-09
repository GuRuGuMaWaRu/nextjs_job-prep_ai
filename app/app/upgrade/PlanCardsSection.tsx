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
import { isStripeConfigured } from "@/core/lib/stripe";

const STRIPE_CHECKOUT_URL = "/api/stripe/create-checkout-session";
const STRIPE_PORTAL_URL = "/api/stripe/create-portal-session";
const STRIPE_CANCEL_SUBSCRIPTION_URL = "/api/stripe/cancel-subscription";

const FREE_PLAN = {
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Perfect for getting started with job prep",
  features: [
    "1 AI mock interview per month",
    "Basic resume analysis",
    "10 practice questions per month",
    "Email support",
  ],
  popular: false,
} as const;

const PRO_PLAN = {
  name: "Pro",
  price: "$29",
  period: "per month",
  description: "Best for serious job seekers",
  features: [
    "Unlimited AI mock interviews",
    "Advanced resume optimization",
    "Unlimited practice questions",
    "Priority support",
    "Interview performance analytics",
    "Custom job description analysis",
  ],
  popular: true,
} as const;

const ENTERPRISE_PLAN = {
  name: "Enterprise",
  price: "Custom",
  period: "contact us",
  description: "For teams and organizations",
  features: [
    "Everything in Pro",
    "Team management dashboard",
    "Custom integrations",
    "Dedicated account manager",
    "White-label options",
    "API access",
  ],
} as const;

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
  plan: typeof FREE_PLAN | typeof PRO_PLAN;
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
      aria-label={isCurrentPlan ? `Current plan: ${plan.name}` : undefined}>
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
          <form action={checkoutAction} method="POST" className="w-full">
            <Button type="submit" size="lg" className="w-full">
              {cta}
            </Button>
          </form>
        ) : cancelAction ? (
          <form action={cancelAction} method="POST" className="w-full">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full">
              {cta}
            </Button>
          </form>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={ctaDisabled}
            variant={ctaDisabled ? "outline" : "default"}>
            {cta}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function EnterpriseBlock() {
  return (
    <Card className="max-w-4xl mx-auto border-enterprise/40 bg-enterprise-bg shadow-lg">
      <CardHeader className="space-y-4 p-5">
        <div className="space-y-1">
          <CardTitle className="text-xl">{ENTERPRISE_PLAN.name}</CardTitle>
          <CardDescription className="text-sm">
            {ENTERPRISE_PLAN.description}
          </CardDescription>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">
              {ENTERPRISE_PLAN.price}
            </span>
            <span className="text-xs text-muted-foreground">
              {ENTERPRISE_PLAN.period}
            </span>
          </div>
        </div>
        <div className="space-y-2 pt-2">
          {ENTERPRISE_PLAN.features.map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-enterprise shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardFooter className="pt-0 px-5">
        <Button
          variant="outline"
          size="lg"
          className="w-full border-enterprise/50 text-enterprise hover:bg-enterprise/10 hover:text-enterprise"
          asChild>
          <a href="mailto:enterprise@landr.example.com">Contact us</a>
        </Button>
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
          role="alert">
          Your subscription payment needs attention. Use{" "}
          <strong>Manage subscription</strong> below to update your payment
          method.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PlanCard
          plan={FREE_PLAN}
          isCurrentPlan={currentPlan === "free" && !hasExistingSubscription}
          cta={
            currentPlan === "free" && !hasExistingSubscription
              ? "Current plan"
              : "Switch to Free"
          }
          ctaDisabled={currentPlan === "free" && !hasExistingSubscription}
          cancelAction={
            hasExistingSubscription && stripeEnabled
              ? STRIPE_CANCEL_SUBSCRIPTION_URL
              : undefined
          }
        />
        <PlanCard
          plan={PRO_PLAN}
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
          <form action={STRIPE_PORTAL_URL} method="POST">
            <Button type="submit" variant="outline" size="sm">
              Manage subscription
            </Button>
          </form>
          <form action={STRIPE_CANCEL_SUBSCRIPTION_URL} method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive">
              Cancel subscription
            </Button>
          </form>
        </div>
      )}

      <EnterpriseBlock />
    </section>
  );
}
