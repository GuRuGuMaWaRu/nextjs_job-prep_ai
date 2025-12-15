"use client";

import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Mic, FileText, Search } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  // Mock user state - toggle this to test authenticated/unauthenticated states
  const isUserLoggedIn = false;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Landr
            </Link>
            <Button asChild variant={isUserLoggedIn ? "default" : "outline"}>
              <Link href={isUserLoggedIn ? "/app" : "/sign-in"}>
                {isUserLoggedIn ? "Dashboard" : "Sign In"}
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Master Your Job Interview with{" "}
            <span className="text-primary">AI-Powered</span> Preparation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Practice interviews, get tailored resume suggestions, and deeply
            understand job descriptions—all powered by cutting-edge AI.
          </p>
          <Button asChild size="lg" className="text-base h-12">
            <Link href="/app">Get Started for Free</Link>
          </Button>
        </div>
      </section>

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
