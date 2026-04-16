/**
 * OAuth IdP identifiers shared by auth UI and Drizzle. Kept free of pg-core so
 * auth code can import values without loading the full schema graph (avoids circular init).
 */
export const oAuthProviders = ["google", "github", "discord"] as const;
export type OAuthProvider = (typeof oAuthProviders)[number];
