import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
} from "@clerk/nextjs";
import { Mic, FileText, Search } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { ThemeToggle } from "@/core/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HeroSection />

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: AI Interview Practice */}
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">AI Interview Practice</CardTitle>
              <CardDescription>
                Engage in realistic mock interviews with our AI interviewer. Get
                instant feedback on your responses, body language, and
                communication style.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 2: Tailored Resume Suggestions */}
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">
                Tailored Resume Suggestions
              </CardTitle>
              <CardDescription>
                Optimize your resume for specific job postings. Our AI analyzes
                job requirements and suggests targeted improvements to highlight
                your strengths.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 3: Job Description Deep Dive */}
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">
                Job Description Deep Dive
              </CardTitle>
              <CardDescription>
                Understand what employers really want. Get detailed breakdowns
                of job requirements, key skills, and insights into company
                culture and expectations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Landr. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                href="#"
                className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <p className="text-2xl font-bold tracking-tight">Landr</p>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Suspense
            fallback={
              <ClerkSignInButton forceRedirectUrl="/app">
                <Button variant="outline">Sign In</Button>
              </ClerkSignInButton>
            }>
            <SignInButton />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

async function SignInButton() {
  const { userId } = await getCurrentUser();
  const isUserLoggedIn = userId != null;

  if (isUserLoggedIn) return redirect("/app");

  return (
    <ClerkSignInButton forceRedirectUrl="/app">
      <Button variant="outline">Sign In</Button>
    </ClerkSignInButton>
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
      <ClerkSignUpButton>
        <Button size="lg" className="text-base h-12">
          Get Started for Free
        </Button>
      </ClerkSignUpButton>
    </section>
  );
}
