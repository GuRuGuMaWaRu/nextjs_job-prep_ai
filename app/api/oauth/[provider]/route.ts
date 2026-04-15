import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import z from "zod";

import { oAuthProviders } from "@/core/drizzle/schema";
import { routes } from "@/core/data/routes";
import { getOAuthClient } from "@/core/features/auth/oauth/base";
import { connectUserToAccount } from "@/core/features/auth/oauth/connectUser";
import { getOAuthConfig } from "@/core/features/auth/oauth/config";
import {
  OAuthMissingEmailError,
  OAuthNoVerifiedEmailError,
  OAuthUnverifiedEmailError,
} from "@/core/features/auth/oauth/errors";
import { createSession } from "@/core/features/auth/session";
import { setSessionCookie } from "@/core/features/auth/cookies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const provider = z.enum(oAuthProviders).parse(rawProvider);

  if (typeof code !== "string" || typeof state !== "string") {
    redirect(`${routes.signIn}?oauthError=oauth_failed`);
  }

  if (getOAuthConfig(provider) == null) {
    redirect(`${routes.signIn}?oauthError=oauth_not_configured`);
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
  } catch (error) {
    if (error instanceof OAuthMissingEmailError) {
      redirect(`${routes.signIn}?oauthError=oauth_missing_email`);
    }

    if (error instanceof OAuthUnverifiedEmailError) {
      redirect(`${routes.signIn}?oauthError=oauth_unverified_email`);
    }

    if (error instanceof OAuthNoVerifiedEmailError) {
      redirect(`${routes.signIn}?oauthError=oauth_no_verified_email`);
    }

    console.error("OAuth error:", error);
    redirect(`${routes.signIn}?oauthError=oauth_failed`);
  }

  redirect(routes.app);
}
