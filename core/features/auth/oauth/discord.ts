import { z } from "zod";

import { env } from "@/core/data/env/server";
import { OAuthClient } from "./base";

export function createDiscordOAuthClient() {
  return new OAuthClient({
    provider: "discord",
    clientId: env.DISCORD_CLIENT_ID!,
    clientSecret: env.DISCORD_CLIENT_SECRET!,
    scopes: ["identify", "email"],
    urls: {
      auth: "https://discord.com/oauth2/authorize",
      token: "https://discord.com/api/oauth2/token",
      user: "https://discord.com/api/users/@me",
    },
    userInfo: {
      schema: z.object({
        id: z.string(),
        email: z.string().email(),
        username: z.string(),
        global_name: z.string().nullable(),
      }),
      parser: (data) => ({
        id: data.id,
        email: data.email,
        name: data.global_name ?? data.username,
      }),
    },
  });
}
