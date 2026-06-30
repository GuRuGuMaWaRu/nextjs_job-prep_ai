import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Mic, FileText, Brain, Check } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { ThemeToggle } from "@/core/components/ThemeToggle";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  PRODUCT_FEATURES,
  PUBLIC_PLANS,
} from "@/core/features/billing/plans";
import { routes } from "@/core/data/routes";

const FEATURE_ICONS = {
  "AI Voice Interviews": Mic,
  "Resume Analysis": FileText,
  "Technical Question Practice": Brain,
} as const;

export default function LandingPage() {
  return (
    <div className="bg-background">
      <SpeedInsights />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <p className="text-2xl font-bold tracking-tight">OfferPilot</p>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Suspense
            fallback={
              <Button variant="outline" asChild>
                <Link href={routes.signIn}>Sign In</Link>
              </Button>
            }>
            <SignInButton />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

async function SignInButton() {
  const { userId } = await getCurrentUserAction();
  const isUserLoggedIn = userId != null;

  if (isUserLoggedIn) return redirect(routes.app);

  return (
    <Button variant="outline" asChild>
      <Link href={routes.signIn}>Sign In</Link>
    </Button>
  );
}

function HeroSection() {
  return (
    <section className="container px-6 py-20 md:py-32 flex flex-col items-center text-center gap-8 max-w-4xl">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
        Master Your Job Interview with{" "}
        <span className="bg-linear-to-r from-primary to-primary/70 text-transparent bg-clip-text text-nowrap">
          AI-Powered
        </span>{" "}
        Preparation
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Practice voice interviews, analyze your resume against a job description,
        and work through technical questions with AI feedback — all tied to the
        roles you are targeting.
      </p>
      <Button size="lg" className="text-base h-12" asChild>
        <Link href={routes.signUp}>Get Started for Free</Link>
      </Button>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRODUCT_FEATURES.map((feature) => {
          const Icon = FEATURE_ICONS[feature.title];

          return (
            <Card className="transition-all" key={feature.title}>
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="container mx-auto px-6 py-12 md:py-16 bg-muted/30">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-balance">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Start on Free to explore the product. Upgrade to Pro when you want
          unlimited interviews, resume analyses, and practice questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        {PUBLIC_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`relative transition-all ${
              plan.popular && "border-primary shadow-lg"
            }`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-2 py-0.5 text-xs font-semibold">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="space-y-4 p-5">
              <div className="space-y-1">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-20 container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-muted-foreground">
        &copy; 2025 OfferPilot. All rights reserved.
      </p>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <Link href="#" className="hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <Link href="#" className="hover:text-foreground transition-colors">
          Terms of Service
        </Link>
        <Link
          href="mailto:contact@offerpilot.example.com"
          className="hover:text-foreground transition-colors">
          Contact us
        </Link>
      </div>
    </footer>
  );
}
