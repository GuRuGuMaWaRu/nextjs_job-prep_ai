import { z } from "zod";

import type { ResolvedOAuthUser } from "./base";
import { OAuthClient } from "./base";
import type { OAuthProviderCredentials } from "./config";

export const googleOAuthUserInfoSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  email_verified: z.boolean().optional(),
});

export type GoogleOAuthUserInfo = z.infer<typeof googleOAuthUserInfoSchema>;

/**
 * Maps Google userinfo payload to normalized OAuth user fields.
 */
export function mapGoogleUserToResolved(
  data: GoogleOAuthUserInfo,
): ResolvedOAuthUser {
  return {
    id: data.sub,
    email: data.email,
    name: data.name,
    emailVerified: data.email_verified === true,
  };
}

export function createGoogleOAuthClient(credentials: OAuthProviderCredentials) {
  return new OAuthClient({
    provider: "google",
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    scopes: ["profile", "email"],
    urls: {
      auth: "https://accounts.google.com/o/oauth2/auth",
      token: "https://oauth2.googleapis.com/token",
      user: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    userInfo: {
      schema: googleOAuthUserInfoSchema,
      parser: mapGoogleUserToResolved,
    },
  });
}
