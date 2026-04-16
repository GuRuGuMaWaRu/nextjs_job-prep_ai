import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import z from "zod";

import { oAuthProviders } from "@/core/drizzle/schema/oauthProviderIds";
import { routes } from "@/core/data/routes";
import { getOAuthClient } from "@/core/features/auth/oauth/base";
import { connectUserToAccount } from "@/core/features/auth/oauth/connectUser";
import { getOAuthConfig } from "@/core/features/auth/oauth/config";
import {
  OAuthMissingEmailError,
  OAuthNoVerifiedEmailError,
  OAuthUnverifiedEmailError,
} from "@/core/features/auth/oauth/errors";
import {
  clearOAuthErrorReturnCookie,
  getOAuthErrorReturnPathAndClear,
} from "@/core/features/auth/oauth/oauthErrorReturn";
import { setLastUsedOAuthProviderCookie } from "@/core/features/auth/oauth/oauthLastUsed";
import { createSession } from "@/core/features/auth/session";
import { setSessionCookie } from "@/core/features/auth/cookies";

async function redirectWithOAuthError(oauthErrorKey: string): Promise<never> {
  const path = await getOAuthErrorReturnPathAndClear();
  redirect(`${path}?oauthError=${oauthErrorKey}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const parsedProvider = z.enum(oAuthProviders).safeParse(rawProvider);

  if (!parsedProvider.success) {
    return await redirectWithOAuthError("oauth_invalid_provider");
  }

  const provider = parsedProvider.data;

  if (typeof code !== "string" || typeof state !== "string") {
    return await redirectWithOAuthError("oauth_failed");
  }

  if (getOAuthConfig(provider) == null) {
    return await redirectWithOAuthError("oauth_not_configured");
  }

  try {
    const oAuthUser = await getOAuthClient(provider).fetchUser(
      code,
      state,
      await cookies(),
    );
    const user = await connectUserToAccount(oAuthUser, provider);

    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
    await setLastUsedOAuthProviderCookie(provider);
  } catch (error) {
    if (error instanceof OAuthMissingEmailError) {
      return await redirectWithOAuthError("oauth_missing_email");
    }

    if (error instanceof OAuthUnverifiedEmailError) {
      return await redirectWithOAuthError("oauth_unverified_email");
    }

    if (error instanceof OAuthNoVerifiedEmailError) {
      return await redirectWithOAuthError("oauth_no_verified_email");
    }

    console.error("OAuth error:", error);
    return await redirectWithOAuthError("oauth_failed");
  }

  await clearOAuthErrorReturnCookie();
  redirect(routes.app);
}
