import { Suspense } from "react";
import Link from "next/link";
import { Check, Zap, MessageCircle, HeadphonesIcon } from "lucide-react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
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
import { getUserPlan } from "@/core/features/auth/permissions";
import type { UserPlan } from "@/core/drizzle/schema/user";

export default function UpgradePage() {
  return (
    <div className="container py-4 max-w-5xl">
      <div className="mb-4">
        <BackLink href={routes.app}>To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        <Suspense fallback={null}>
          <SuspendedAlert />
        </Suspense>

        <Suspense fallback={<HeadlineSection currentPlan={null} />}>
          <HeadlineWithPlan />
        </Suspense>

        <Suspense fallback={null}>
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
        <p className="text-sm text-muted-foreground mt-3 inline-block" aria-live="polite">
          You&apos;re on the <strong className="text-foreground">{currentPlan === "pro" ? "Pro" : "Free"}</strong> plan.
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

async function PlanCardsSection() {
  const currentPlan = await getUserPlan();

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PlanCard
          plan={FREE_PLAN}
          isCurrentPlan={currentPlan === "free"}
          cta="Current plan"
          ctaDisabled
          ctaComingSoon={false}
        />
        <PlanCard
          plan={PRO_PLAN}
          isCurrentPlan={currentPlan === "pro"}
          cta={currentPlan === "pro" ? "Current plan" : "Upgrade to Pro"}
          ctaDisabled={currentPlan === "pro"}
          ctaComingSoon={currentPlan !== "pro"}
        />
      </div>

      <EnterpriseBlock />
    </section>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  cta,
  ctaDisabled,
  ctaComingSoon,
}: {
  plan: typeof FREE_PLAN | typeof PRO_PLAN;
  isCurrentPlan: boolean;
  cta: string;
  ctaDisabled: boolean;
  ctaComingSoon?: boolean;
}) {
  const showBadges = plan.popular || isCurrentPlan;

  return (
    <Card
      className={`relative transition-all hover:shadow-lg ${
        plan.popular && "border-primary shadow-lg"
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
          <CardDescription className="text-sm">{plan.description}</CardDescription>
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
        <Button
          size="lg"
          className="w-full"
          disabled={ctaDisabled}
          asChild={!ctaDisabled && !ctaComingSoon}
        >
          {ctaComingSoon ? (
            <span>Coming soon</span>
          ) : ctaDisabled ? (
            <span>{cta}</span>
          ) : (
            <Link href={routes.upgrade}>{cta}</Link>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function EnterpriseBlock() {
  return (
    <Card className="max-w-4xl mx-auto bg-muted/30">
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
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardFooter className="pt-0 px-5">
        <Button variant="outline" size="lg" className="w-full" asChild>
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
      "Yes. You can cancel your Pro subscription at any time. You'll keep access until the end of your billing period, then your account will switch back to the Free plan.",
  },
  {
    question: "How does billing work?",
    answer:
      "Pro is billed monthly. Payment is charged at the start of each billing cycle. We'll send you a receipt by email. When Pro is available, you can manage your subscription from your account.",
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
