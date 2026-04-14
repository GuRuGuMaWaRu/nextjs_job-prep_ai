import z from "zod";
import crypto from "crypto";

import { env } from "@/core/data/env/server";
import type { Cookies } from "@/core/features/auth/oauth/types";
import type { OAuthProvider } from "@/core/drizzle/schema";

import { createDiscordOAuthClient } from "./discord";
import { createGoogleOAuthClient } from "./google";
import { createGithubOAuthClient } from "./github";

const CODE_VERIFIER_COOKIE_KEY = "oauth_code_verifier";
const STATE_COOKIE_KEY = "oauth_state";
const COOKIE_EXPIRATION_SECONDS = 60 * 10; // 10 minutes

type ResolvedOAuthUser = { id: string; email: string; name: string };

type UserInfoWithParser<T> = {
  schema: z.ZodSchema<T>;
  parser: (data: T) => ResolvedOAuthUser;
};

type UserInfoWithResolver<T> = {
  schema: z.ZodSchema<T>;
  resolveUser: (args: {
    data: T;
    accessToken: string;
    tokenType: string;
  }) => Promise<ResolvedOAuthUser>;
};

type OAuthUserInfo<T> = UserInfoWithParser<T> | UserInfoWithResolver<T>;

type OAuthClientConfig<T> = {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  urls: { auth: string; token: string; user: string };
  userInfo: OAuthUserInfo<T>;
};

export class OAuthClient<T> {
  private readonly provider: OAuthProvider;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly urls: {
    auth: string;
    token: string;
    user: string;
  };
  private readonly userInfo: OAuthUserInfo<T>;
  private readonly tokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
  });

  constructor({
    provider,
    clientId,
    clientSecret,
    scopes,
    urls,
    userInfo,
  }: OAuthClientConfig<T>) {
    this.provider = provider;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
    this.userInfo = userInfo;
  }

  private get redirectUrl() {
    return new URL(this.provider, env.OAUTH_REDIRECT_URL_BASE);
  }

  createAuthUrl(cookies: Pick<Cookies, "set">): string {
    const state = createState(cookies);
    const codeVerifier = createCodeVerifier(cookies);
    const url = new URL(this.urls.auth);

    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUrl.toString());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set(
      "code_challenge",
      crypto.hash("sha256", codeVerifier, "base64url"),
    );
    url.searchParams.set("code_challenge_method", "S256");

    return url.toString();
  }

  async fetchUser(code: string, state: string, cookies: Pick<Cookies, "get">) {
    const isValidState = validateState(state, cookies);

    if (!isValidState) {
      throw new InvalidStateError();
    }

    const { accessToken, tokenType } = await this.fetchToken(
      code,
      getCodeVerifier(cookies),
    );

    try {
      const response = await fetch(this.urls.user, {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      });

      const rawData = await response.json();

      const { data, success, error } = this.userInfo.schema.safeParse(rawData);
      if (!success) {
        throw new InvalidUserError(error);
      }

      if ("resolveUser" in this.userInfo) {
        return await this.userInfo.resolveUser({
          data,
          accessToken,
          tokenType,
        });
      }

      return this.userInfo.parser(data);
    } catch (error) {
      throw new Error("Failed to fetch user", { cause: error });
    }
  }

  private async fetchToken(code: string, codeVerifier: string) {
    try {
      const response = await fetch(this.urls.token, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUrl.toString(),
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }).toString(),
      });

      const rawData = await response.json();

      const { data, success, error } = this.tokenSchema.safeParse(rawData);

      if (!success) {
        throw new InvalidTokenError(error);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
      };
    } catch (error) {
      throw new Error("Failed to fetch token", { cause: error });
    }
  }
}

export function getOAuthClient(provider: OAuthProvider) {
  switch (provider) {
    case "discord":
      return createDiscordOAuthClient();
    case "google":
      return createGoogleOAuthClient();
    case "github":
      return createGithubOAuthClient();
    default:
      throw new Error(`Unsupported provider: ${provider}` as never);
  }
}

class InvalidTokenError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid token", { cause: zodError });
  }
}

class InvalidUserError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid user", { cause: zodError });
  }
}

class InvalidStateError extends Error {
  constructor() {
    super("Invalid state");
  }
}

class InvalidCodeVerifierError extends Error {
  constructor() {
    super("Invalid code verifier");
  }
}

function createState(cookies: Pick<Cookies, "set">): string {
  const state = crypto.randomBytes(64).toString("hex");

  cookies.set(STATE_COOKIE_KEY, state, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
  });
  return state;
}

function createCodeVerifier(cookies: Pick<Cookies, "set">): string {
  const codeVerifier = crypto.randomBytes(64).toString("hex");

  cookies.set(CODE_VERIFIER_COOKIE_KEY, codeVerifier, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
  });
  return codeVerifier;
}

function validateState(state: string, cookies: Pick<Cookies, "get">): boolean {
  const storedState = cookies.get(STATE_COOKIE_KEY)?.value;
  return storedState === state;
}

function getCodeVerifier(cookies: Pick<Cookies, "get">): string {
  const codeVerifier = cookies.get(CODE_VERIFIER_COOKIE_KEY)?.value;
  if (codeVerifier == null) {
    throw new InvalidCodeVerifierError();
  }
  return codeVerifier;
}
