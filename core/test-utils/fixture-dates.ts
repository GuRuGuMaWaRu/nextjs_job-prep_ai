/** Fixed instant for deterministic `createdAt` / `updatedAt` in factories and assertions. */
export const TEST_FIXTURE_NOW_ISO = "2024-01-01T00:00:00.000Z" as const;

/** Fixed instant in the past for expired-session fixtures. */
export const TEST_EXPIRED_AT_ISO = "2020-01-01T00:00:00.000Z" as const;
