import { z } from "zod";

import { env } from "@/core/data/env/server";
import { OAuthClient } from "./base";

export function createGoogleOAuthClient() {
  return new OAuthClient({
    provider: "google",
    clientId: env.GOOGLE_CLIENT_ID!,
    clientSecret: env.GOOGLE_CLIENT_SECRET!,
    scopes: ["profile", "email"],
    urls: {
      auth: "https://accounts.google.com/o/oauth2/auth",
      token: "https://oauth2.googleapis.com/token",
      user: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    userInfo: {
      schema: z.object({
        sub: z.string(),
        email: z.string().email(),
        name: z.string(),
      }),
      parser: (data) => ({ id: data.sub, email: data.email, name: data.name }),
    },
  });
}
