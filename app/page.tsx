import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  Mic,
  FileText,
  Brain,
  TrendingUp,
  Clock,
  Target,
  Quote,
  Check,
} from "lucide-react";

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
import { routes } from "@/core/data/routes";
import { UserAvatar } from "@/core/features/users/components/UserAvatar";

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
        Accelerate your job search with personalized AI-powered tools. Get
        feedback on your resume, practice with mock interviews, and understand
        job descriptions like a pro.
      </p>
      <Button size="lg" className="text-base h-12" asChild>
        <Link href={routes.signUp}>Get Started for Free</Link>
      </Button>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "AI Interview Practice",
      description:
        "Engage in realistic mock interviews with our AI interviewer. Get instant feedback on your responses, body language, and communication style.",
      icon: <Mic className="w-6 h-6 text-primary" />,
    },
    {
      title: "Tailored Resume Suggestions",
      description:
        "Optimize your resume for specific job postings. Our AI analyzes job requirements and suggests targeted improvements to highlight your strengths.",
      icon: <FileText className="w-6 h-6 text-primary" />,
    },
    {
      title: "Technical Questions Practice",
      description:
        "Practice answering technical questions tailored to the job description. Get instant feedback on your responses and improve your chances of landing an interview.",
      icon: <Brain className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card className="transition-all" key={feature.title}>
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                {feature.icon}
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
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
    },
    {
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
    },
  ];

  return (
    <section className="container mx-auto px-6 py-12 md:py-16 bg-muted/30">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-balance">
          Choose Your <span className="text-primary">Success Plan</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Start for free and upgrade when you&apos;re ready to accelerate your
          job search. All plans include AI-powered tools to help you land your
          dream job.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        {plans.map((plan) => (
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
