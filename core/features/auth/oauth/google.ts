import { z } from "zod";

import { OAuthClient } from "./base";
import type { OAuthProviderCredentials } from "./config";

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
      schema: z.object({
        sub: z.string(),
        email: z.string().email(),
        name: z.string(),
      }),
      parser: (data) => ({ id: data.sub, email: data.email, name: data.name }),
    },
  });
}
