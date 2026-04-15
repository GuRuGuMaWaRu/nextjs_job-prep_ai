import { useSearchParams } from "next/navigation";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Failed to connect. Please try again.",
  oauth_not_configured: "That sign-in method is not available.",
  oauth_missing_email:
    "Sign-in did not return an email. Add or verify an email with that provider, or sign in another way.",
};

export function OAuthQueryErrorBanner({ formError }: { formError?: string }) {
  const searchParams = useSearchParams();
  const oauthKey = searchParams.get("oauthError") ?? undefined;
  const oauthMessage = oauthKey ? OAUTH_ERROR_MESSAGES[oauthKey] : undefined;
  const bannerError = formError ?? oauthMessage;

  if (!bannerError) {
    return null;
  }

  return (
    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center">
      {bannerError}
    </div>
  );
}
