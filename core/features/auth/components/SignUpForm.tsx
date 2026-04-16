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
import type { OAuthProvider } from "@/core/drizzle/schema/oauthProviderIds";
import { signUpAction } from "@/core/features/auth/actions";
import { OAuthQueryErrorBanner } from "@/core/features/auth/components/OAuthQueryErrorBanner";
import { OAuthSignInSection } from "@/core/features/auth/components/OAuthSignInSection";

export function SignUpForm({
  configuredOAuthProviders,
  lastUsedOAuthProvider,
}: {
  configuredOAuthProviders: OAuthProvider[];
  lastUsedOAuthProvider?: OAuthProvider;
}) {
  const [state, action, isPending] = useActionState(signUpAction, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={null}>
          <OAuthQueryErrorBanner formError={state?.error} />
        </Suspense>

        <OAuthSignInSection
          configuredOAuthProviders={configuredOAuthProviders}
          lastUsedOAuthProvider={lastUsedOAuthProvider}
          oauthErrorReturn="sign-up"
        />

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              defaultValue={state?.fields?.name}
              disabled={isPending}
              aria-invalid={state?.fieldErrors?.name != null}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={state?.fieldErrors?.password != null}
              required
              minLength={8}
            />
            {state?.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with a letter and number
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href={routes.signIn} className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
