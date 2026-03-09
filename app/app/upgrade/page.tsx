import { Suspense } from "react";
import { Check, Zap, MessageCircle, HeadphonesIcon } from "lucide-react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { Skeleton } from "@/core/components/Skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion";
import { routes } from "@/core/data/routes";
import { canCreateInterview } from "@/core/features/interviews/actions";
import { getCurrentUser } from "@/core/features/auth/actions";
import {
  getUserPlan,
  getUserSubscriptionInfo,
} from "@/core/features/auth/permissions";
import { getStripe, isStripeConfigured } from "@/core/lib/stripe";
import type { UserPlan } from "@/core/drizzle/schema/user";
import { RevalidateOnStripeReturn } from "./RevalidateOnStripeReturn";

const STRIPE_CHECKOUT_URL = "/api/stripe/create-checkout-session";
const STRIPE_PORTAL_URL = "/api/stripe/create-portal-session";
const STRIPE_CANCEL_SUBSCRIPTION_URL = "/api/stripe/cancel-subscription";

type UpgradePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function UpgradePage(props: UpgradePageProps) {
  const rawParams = props.searchParams ?? {};
  const searchParams =
    rawParams instanceof Promise ? await rawParams : rawParams;
  const canceled = searchParams.canceled === "true";
  const canceledSubscription = searchParams.canceled_subscription === "true";

  let success = false;
  if (searchParams.success === "true") {
    const sessionId =
      typeof searchParams.session_id === "string"
        ? searchParams.session_id
        : null;
    const stripe = getStripe();

    if (sessionId && stripe) {
      try {
        const { userId } = await getCurrentUser();
        const session =
          await stripe.checkout.sessions.retrieve(sessionId);

        success =
          session.payment_status === "paid" &&
          !!userId &&
          session.metadata?.userId === userId;
      } catch {
        // Invalid or expired session — don't show the success banner.
      }
    }
  }

  return (
    <div className="container py-4 max-w-5xl">
      <RevalidateOnStripeReturn
        success={success}
        canceled={canceled}
        canceledSubscription={canceledSubscription}
      />
      <div className="mb-4">
        <BackLink href={routes.app}>To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        {success && (
          <div
            className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm text-green-800 dark:text-green-200"
            role="alert">
            You&apos;re now on the <strong>Pro</strong> plan. Thank you for
            upgrading!
          </div>
        )}
        {canceled && (
          <div
            className="rounded-lg border border-muted-foreground/30 bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground"
            role="status">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}
        {canceledSubscription && (
          <div
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-800 dark:text-amber-200"
            role="status">
            You&apos;ve canceled your subscription. You&apos;ll keep Pro until
            the end of your billing period, then you&apos;ll be on the Free
            plan.
          </div>
        )}

        <Suspense fallback={null}>
          <SuspendedAlert />
        </Suspense>

        <Suspense fallback={<HeadlineSection currentPlan={null} />}>
          <HeadlineWithPlan />
        </Suspense>

        <Suspense fallback={<PlanCardsSkeleton />}>
          <PlanCardsSection />
        </Suspense>

        <WhyUpgradeSection />

        <FAQSection />
      </div>
    </div>
  );
}

async function SuspendedAlert() {
  const hasPermissionForInterviews = await canCreateInterview();
  if (hasPermissionForInterviews) return null;

  return <PlanLimitAlert />;
}

function HeadlineSection({ currentPlan }: { currentPlan: UserPlan | null }) {
  return (
    <section className="text-center space-y-3">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Upgrade your plan
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
        Get unlimited interviews and practice questions so you can land <br />
        your <span className="text-primary">dream job</span> faster.
      </p>
      {currentPlan != null && (
        <p
          className="text-sm text-muted-foreground mt-3 inline-block"
          aria-live="polite">
          You&apos;re on the{" "}
          <strong className="text-foreground">
            {currentPlan === "pro" ? "Pro" : "Free"}
          </strong>{" "}
          plan.
        </p>
      )}
    </section>
  );
}

async function HeadlineWithPlan() {
  const currentPlan = await getUserPlan();
  return <HeadlineSection currentPlan={currentPlan} />;
}

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

function PlanCardSkeleton() {
  return (
    <Card className="relative">
      <CardHeader className="space-y-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardFooter className="pt-0 px-5">
        <Skeleton className="h-11 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

function PlanCardsSkeleton() {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
      <Card className="max-w-4xl mx-auto bg-muted/30">
        <CardHeader className="space-y-4 p-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full max-w-[240px]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardFooter className="pt-0 px-5">
          <Skeleton className="h-11 w-full rounded-md" />
        </CardFooter>
      </Card>
    </section>
  );
}

async function PlanCardsSection() {
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
            <Button type="submit" variant="outline" size="lg" className="w-full">
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

function WhyUpgradeSection() {
  const points = [
    {
      icon: <Zap className="w-5 h-5 text-primary" />,
      text: "Unlimited AI mock interviews so you can practice until you're confident.",
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-primary" />,
      text: "Unlimited practice questions tailored to your target role.",
    },
    {
      icon: <HeadphonesIcon className="w-5 h-5 text-primary" />,
      text: "Priority support when you need help before a big interview.",
    },
  ];

  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold tracking-tight mb-4 text-center">
        Why upgrade?
      </h2>
      <ul className="space-y-4">
        {points.map((point, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 mt-0.5 rounded-lg bg-primary/10 p-1.5">
              {point.icon}
            </span>
            <span className="text-muted-foreground">{point.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: "What's included in Pro?",
    answer:
      "Pro includes unlimited AI mock interviews, unlimited practice questions, advanced resume optimization, priority support, interview performance analytics, and custom job description analysis.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You will be able to cancel your Pro subscription at any time. You'll keep access until the end of your billing period, then your account will switch back to the Free plan.",
  },
  {
    question: "How does billing work?",
    answer:
      'Pro will be billed monthly. Payment will be charged at the start of each billing cycle. We plan to send you a receipt by email. You will be able to manage your subscription or payment method from the Upgrade page using the "Manage subscription" button.',
  },
] as const;

function FAQSection() {
  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold tracking-tight mb-4 text-center">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
