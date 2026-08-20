import { z } from "zod";

/**
 * Returns whether `id` is a valid UUID string.
 * Use at action boundaries before querying Postgres uuid columns.
 */
export function assertUUID(id: string) {
  const UuidParam = z.string().uuid();

  const uuid = UuidParam.safeParse(id);

  return uuid.success;
}
