import { z } from "zod";
import { env } from "@/core/data/env/server";
import { OAuthClient } from "./base";

const githubUserEmailsSchema = z.array(
  z.object({
    email: z.string().email(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
);

export function createGithubOAuthClient() {
  return new OAuthClient({
    provider: "github",
    clientId: env.GITHUB_CLIENT_ID!,
    clientSecret: env.GITHUB_CLIENT_SECRET!,
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
        let email = data.email;

        try {
          if (email == null) {
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

            const fromList =
              parsed.data.find((e) => e.primary && e.verified) ??
              parsed.data.find((e) => e.primary) ??
              parsed.data.find((e) => e.verified) ??
              parsed.data[0];

            email = fromList?.email ?? null;
          }
        } catch (error) {
          throw new Error("Failed to fetch GitHub user emails", {
            cause: error,
          });
        }

        if (email == null) {
          throw new Error("GitHub did not return an accessible email");
        }

        return {
          id: String(data.id),
          email,
          name: data.name ?? data.login,
        };
      },
    },
  });
}
