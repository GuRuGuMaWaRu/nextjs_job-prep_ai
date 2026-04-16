import { SignUpForm } from "@/core/features/auth/components/SignUpForm";
import { getConfiguredOAuthProviders } from "@/core/features/auth/oauth/config";

export default function SignUpPage() {
  const configuredOAuthProviders = getConfiguredOAuthProviders();

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignUpForm configuredOAuthProviders={configuredOAuthProviders} />
    </div>
  );
}
