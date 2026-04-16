import { SignInForm } from "@/core/features/auth/components/SignInForm";
import { getConfiguredOAuthProviders } from "@/core/features/auth/oauth/config";

export default function SignInPage() {
  const configuredOAuthProviders = getConfiguredOAuthProviders();

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignInForm configuredOAuthProviders={configuredOAuthProviders} />
    </div>
  );
}
