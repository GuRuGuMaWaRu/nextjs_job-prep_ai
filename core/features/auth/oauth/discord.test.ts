jest.mock("@/core/data/env/server", () => ({
  env: {
    OAUTH_REDIRECT_URL_BASE: "http://localhost:3000",
  },
}));

import {
  discordUserSchema,
  resolveDiscordOAuthUser,
} from "@/core/features/auth/oauth/discord";
import { OAuthMissingEmailError } from "@/core/features/auth/oauth/errors";

const basePayload = {
  id: "80351110224678912",
  username: "Nelly",
  global_name: null as string | null,
};

describe("discordUserSchema", () => {
  it("accepts payload without email field", () => {
    const result = discordUserSchema.safeParse({ ...basePayload });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
    }
  });

  it("accepts email null", () => {
    const result = discordUserSchema.safeParse({
      ...basePayload,
      email: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it("accepts valid email", () => {
    const result = discordUserSchema.safeParse({
      ...basePayload,
      email: "nelly@discord.com",
    });

    expect(result.success).toBe(true);
  });

  it("maps empty string email to null via preprocess", () => {
    const result = discordUserSchema.safeParse({
      ...basePayload,
      email: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });
});

describe("resolveDiscordOAuthUser", () => {
  it("throws OAuthMissingEmailError when email is missing", async () => {
    const parsed = discordUserSchema.parse({ ...basePayload });

    await expect(resolveDiscordOAuthUser(parsed)).rejects.toBeInstanceOf(
      OAuthMissingEmailError,
    );
  });

  it("throws OAuthMissingEmailError when email is null", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: null,
    });

    await expect(resolveDiscordOAuthUser(parsed)).rejects.toBeInstanceOf(
      OAuthMissingEmailError,
    );
  });

  it("throws OAuthMissingEmailError when email was empty string (preprocessed to null)", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "",
    });

    await expect(resolveDiscordOAuthUser(parsed)).rejects.toBeInstanceOf(
      OAuthMissingEmailError,
    );
  });

  it("returns normalized user when email is present", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "nelly@discord.com",
      global_name: "Display",
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toEqual({
      id: "80351110224678912",
      email: "nelly@discord.com",
      name: "Display",
    });
  });

  it("uses username when global_name is null", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "nelly@discord.com",
      global_name: null,
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toMatchObject({
      name: "Nelly",
    });
  });

  it("lowercases email", async () => {
    const parsed = discordUserSchema.parse({
      ...basePayload,
      email: "Nelly@Discord.COM",
    });

    await expect(resolveDiscordOAuthUser(parsed)).resolves.toMatchObject({
      email: "nelly@discord.com",
    });
  });
});
