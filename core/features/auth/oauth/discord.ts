import { z } from "zod";

import { OAuthClient } from "./base";
import type { OAuthProviderCredentials } from "./config";
import { OAuthMissingEmailError } from "./errors";

export const discordUserSchema = z.object({
  id: z.string(),
  email: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().email().nullish(),
  ),
  verified: z.boolean().optional(),
  username: z.string(),
  global_name: z.string().nullable(),
});

export type DiscordUserPayload = z.infer<typeof discordUserSchema>;

/**
 * Maps Discord `/users/@me` payload to app user fields, or rejects when no email is present.
 */
export async function resolveDiscordOAuthUser(data: DiscordUserPayload) {
  const email = data.email;

  if (email == null) {
    throw new OAuthMissingEmailError("discord");
  }

  return {
    id: data.id,
    email: email.toLowerCase(),
    name: data.global_name ?? data.username,
    emailVerified: data.verified === true,
  };
}

export function createDiscordOAuthClient(
  credentials: OAuthProviderCredentials,
) {
  return new OAuthClient({
    provider: "discord",
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    scopes: ["identify", "email"],
    urls: {
      auth: "https://discord.com/oauth2/authorize",
      token: "https://discord.com/api/oauth2/token",
      user: "https://discord.com/api/users/@me",
    },
    userInfo: {
      schema: discordUserSchema,
      resolveUser: async ({ data }) =>
        resolveDiscordOAuthUser(data as DiscordUserPayload),
    },
  });
}
