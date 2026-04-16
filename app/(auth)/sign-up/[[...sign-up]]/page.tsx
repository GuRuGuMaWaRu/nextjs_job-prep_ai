import { Suspense } from "react";

import { SignUpForm } from "@/core/features/auth/components/SignUpForm";
import { getConfiguredOAuthProviders } from "@/core/features/auth/oauth/config";
import { getLastUsedOAuthProvider } from "@/core/features/auth/oauth/oauthLastUsed";
import type { OAuthProvider } from "@/core/drizzle/schema/userOAuthAccount";

export default function SignUpPage() {
  const configuredOAuthProviders = getConfiguredOAuthProviders();

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Suspense
        fallback={
          <SignUpForm configuredOAuthProviders={configuredOAuthProviders} />
        }
      >
        <SignUpFormWithLastUsedOAuth
          configuredOAuthProviders={configuredOAuthProviders}
        />
      </Suspense>
    </div>
  );
}

async function SignUpFormWithLastUsedOAuth({
  configuredOAuthProviders,
}: {
  configuredOAuthProviders: OAuthProvider[];
}) {
  const lastUsedOAuthProvider = await getLastUsedOAuthProvider();

  return (
    <SignUpForm
      configuredOAuthProviders={configuredOAuthProviders}
      lastUsedOAuthProvider={lastUsedOAuthProvider}
    />
  );
}
