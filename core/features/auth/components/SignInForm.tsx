"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";

import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { PasswordInput } from "@/core/components/ui/password-input";
import { routes } from "@/core/data/routes";
import type { OAuthProvider } from "@/core/drizzle/schema/userOAuthAccount";
import { signInAction } from "@/core/features/auth/actions";
import { OAuthSignInSection } from "@/core/features/auth/components/OAuthSignInSection";
import { OAuthQueryErrorBanner } from "@/core/features/auth/components/OAuthQueryErrorBanner";

export function SignInForm({
  configuredOAuthProviders,
  lastUsedOAuthProvider,
}: {
  configuredOAuthProviders: OAuthProvider[];
  lastUsedOAuthProvider?: OAuthProvider;
}) {
  const [state, action, isPending] = useActionState(signInAction, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={null}>
          <OAuthQueryErrorBanner formError={state?.error} />
        </Suspense>

        <OAuthSignInSection
          configuredOAuthProviders={configuredOAuthProviders}
          lastUsedOAuthProvider={lastUsedOAuthProvider}
        />

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              defaultValue={state?.fields?.email}
              disabled={isPending}
              aria-invalid={state?.fieldErrors?.email != null}
              required
            />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={state?.fieldErrors?.password != null}
              required
            />
            {state?.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href={routes.signUp} className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
