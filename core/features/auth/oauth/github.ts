import { z } from "zod";

import { OAuthClient } from "./base";
import type { OAuthProviderCredentials } from "./config";
import { OAuthNoVerifiedEmailError } from "./errors";

type GithubEmailEntry = {
  email: string;
  primary: boolean;
  verified: boolean;
};

const githubUserEmailsSchema = z.array(
  z.object({
    email: z.string().email(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
);

export function createGithubOAuthClient(credentials: OAuthProviderCredentials) {
  return new OAuthClient({
    provider: "github",
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    scopes: ["user:email", "read:user"],
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
      resolveUser: async ({ data, accessToken, tokenType }) => {
        try {
          const response = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `${tokenType} ${accessToken}`,
              Accept: "application/vnd.github+json",
            },
          });

          const rawEmails = await response.json();
          const parsed = githubUserEmailsSchema.safeParse(rawEmails);

          if (!parsed.success) {
            throw new Error("Invalid GitHub user emails response", {
              cause: parsed.error,
            });
          }

          const email = selectGithubEmailFromVerifiedList(parsed.data);

          if (email == null) {
            throw new OAuthNoVerifiedEmailError("github");
          }

          return {
            id: String(data.id),
            email,
            name: data.name ?? data.login,
            emailVerified: true,
          };
        } catch (error) {
          if (error instanceof OAuthNoVerifiedEmailError) {
            throw error;
          }
          throw new Error("Failed to fetch GitHub user emails", {
            cause: error,
          });
        }
      },
    },
  });
}

/**
 * Picks primary+verified, else first verified GitHub email; returns lowercased email or null.
 */
export function selectGithubEmailFromVerifiedList(
  emails: GithubEmailEntry[],
): string | null {
  const primaryVerified = emails.find((e) => e.primary && e.verified);
  const firstVerified = emails.find((e) => e.verified);
  const chosen = primaryVerified ?? firstVerified;

  if (chosen == null) {
    return null;
  }

  return chosen.email.toLowerCase();
}
