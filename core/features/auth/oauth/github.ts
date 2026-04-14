import { z } from "zod";
import { env } from "@/core/data/env/server";
import { OAuthClient } from "./base";

export function createGithubOAuthClient() {
  return new OAuthClient({
    provider: "github",
    clientId: env.GITHUB_CLIENT_ID!,
    clientSecret: env.GITHUB_CLIENT_SECRET!,
    scopes: ["user:email", "user:read"],
    urls: {
      auth: "https://github.com/login/oauth/authorize",
      token: "https://github.com/login/oauth/access_token",
      user: "https://api.github.com/user",
    },
    userInfo: {
      schema: z.object({
        id: z.number(),
        name: z.string().nullable(),
        login: z.string(),
        email: z.string().email().nullable(),
      }),
      parser: (data) => ({
        id: String(data.id),
        email: data.email,
        name: data.name ?? data.login,
      }),
    },
  });
}
