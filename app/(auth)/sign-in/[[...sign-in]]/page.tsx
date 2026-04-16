import { Suspense } from "react";

import { SignInForm } from "@/core/features/auth/components/SignInForm";
import { getConfiguredOAuthProviders } from "@/core/features/auth/oauth/config";
import { getLastUsedOAuthProvider } from "@/core/features/auth/oauth/oauthLastUsed";
import type { OAuthProvider } from "@/core/drizzle/schema/userOAuthAccount";

export default function SignInPage() {
  const configuredOAuthProviders = getConfiguredOAuthProviders();

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Suspense
        fallback={
          <SignInForm configuredOAuthProviders={configuredOAuthProviders} />
        }
      >
        <SignInFormWithLastUsedOAuth
          configuredOAuthProviders={configuredOAuthProviders}
        />
      </Suspense>
    </div>
  );
}

async function SignInFormWithLastUsedOAuth({
  configuredOAuthProviders,
}: {
  configuredOAuthProviders: OAuthProvider[];
}) {
  const lastUsedOAuthProvider = await getLastUsedOAuthProvider();

  return (
    <SignInForm
      configuredOAuthProviders={configuredOAuthProviders}
      lastUsedOAuthProvider={lastUsedOAuthProvider}
    />
  );
}
